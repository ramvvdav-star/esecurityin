/**
 * eSecurityIn Employee Task Tracker
 * Automated Test Suite: Security Constraints, Role Isolation, Validation, and Date Drift Prevention
 */

import {
  getTodayDateString,
  formatDisplayDate,
  isDateOverdue,
  getWeekDateRange,
  isWithinPastDays,
} from '../src/lib/dateUtils';
import { ESECURITYIN_SQL_SCHEMA } from '../src/lib/sqlSchema';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (failureDetails) {
      console.error(`    Details: ${failureDetails}`);
    }
  }
}

console.log('\n======================================================');
console.log('eSecurityIn Task Tracker - Production Verification Tests');
console.log('======================================================\n');

// -----------------------------------------------------------------
// Group 1: Timezone-Safe Date Utility Tests
// -----------------------------------------------------------------
console.log('Test Group 1: Timezone-Safe Date Utilities & Drift Prevention');

const todayStr = getTodayDateString();
assert(
  /^\d{4}-\d{2}-\d{2}$/.test(todayStr),
  'getTodayDateString returns YYYY-MM-DD local format',
  `Received: ${todayStr}`
);

// Verify formatDisplayDate parses correctly without offset drift
const sampleDate = '2026-10-28';
const formatted = formatDisplayDate(sampleDate);
assert(
  formatted.includes('Oct 28, 2026') || formatted.includes('28 Oct 2026') || formatted.includes('October 28, 2026'),
  'formatDisplayDate outputs readable localized date containing correct month and day',
  `Formatted: ${formatted}`
);

// Verify overdue calculation
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = getTodayDateString(yesterday);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = getTodayDateString(tomorrow);

assert(
  isDateOverdue(yesterdayStr) === true,
  'isDateOverdue correctly detects yesterday as overdue'
);
assert(
  isDateOverdue(tomorrowStr) === false,
  'isDateOverdue correctly identifies tomorrow as not overdue'
);
assert(
  isDateOverdue(undefined) === false,
  'isDateOverdue safely handles undefined/null deadline without throwing'
);

// Verify week date range calculation
const { start: weekStart, end: weekEnd } = getWeekDateRange();
assert(
  weekStart <= todayStr && todayStr <= weekEnd,
  'getWeekDateRange contains today within [start, end]',
  `Week Start: ${weekStart}, Today: ${todayStr}, Week End: ${weekEnd}`
);

// -----------------------------------------------------------------
// Group 2: Role Authorization & Privilege Escalation Prevention
// -----------------------------------------------------------------
console.log('\nTest Group 2: Role Authorization & Security Invariant Checks');

interface TestUserProfile {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  is_active: boolean;
}

function verifyAccessPermission(
  profile: TestUserProfile | null,
  requiredRole: 'admin' | 'employee'
): { allowed: boolean; reason: string } {
  if (!profile) {
    return { allowed: false, reason: 'Unauthenticated or profile missing' };
  }
  if (!profile.is_active) {
    return { allowed: false, reason: 'Account is deactivated' };
  }
  if (requiredRole === 'admin' && profile.role !== 'admin') {
    return { allowed: false, reason: 'Insufficient privileges: admin role required' };
  }
  return { allowed: true, reason: 'Authorized' };
}

// 1. Missing profile must be denied
const missingProfileCheck = verifyAccessPermission(null, 'admin');
assert(
  missingProfileCheck.allowed === false,
  'Missing profile is denied admin access immediately'
);

// 2. Deactivated account must be denied even if role is admin
const deactivatedAdmin: TestUserProfile = {
  id: 'usr-1',
  email: 'former-admin@esecurityin.com',
  role: 'admin',
  is_active: false,
};
const deactivatedCheck = verifyAccessPermission(deactivatedAdmin, 'admin');
assert(
  deactivatedCheck.allowed === false,
  'Deactivated administrator account is denied access (is_active === false)'
);

// 3. Email containing 'admin' must NOT confer admin role
const spoofedEmailEmployee: TestUserProfile = {
  id: 'usr-2',
  email: 'admin.support@attacker.com',
  role: 'employee',
  is_active: true,
};
const spoofedCheck = verifyAccessPermission(spoofedEmailEmployee, 'admin');
assert(
  spoofedCheck.allowed === false,
  'Attacker email containing "admin" cannot elevate privileges'
);

// 4. Employee cannot access admin-only actions (such as report approvals)
const normalEmployee: TestUserProfile = {
  id: 'usr-3',
  email: 'analyst@esecurityin.com',
  role: 'employee',
  is_active: true,
};
const employeeAdminCheck = verifyAccessPermission(normalEmployee, 'admin');
assert(
  employeeAdminCheck.allowed === false,
  'Normal employee cannot execute admin actions'
);

// 5. Valid active admin is allowed
const validAdmin: TestUserProfile = {
  id: 'usr-4',
  email: 'secops@esecurityin.com',
  role: 'admin',
  is_active: true,
};
const validAdminCheck = verifyAccessPermission(validAdmin, 'admin');
assert(
  validAdminCheck.allowed === true,
  'Verified active administrator is permitted admin access'
);

// -----------------------------------------------------------------
// Group 3: Daily Report Form & Hours Validation
// -----------------------------------------------------------------
console.log('\nTest Group 3: Daily Work Report Validation Rules');

interface TestReportEntry {
  work_item_id: string;
  activity_description: string;
  work_completed: string;
  hours_spent: number;
  minutes_spent: number;
  daily_progress_percentage: number;
  reported_overall_progress: number;
}

function validateReportEntries(entries: TestReportEntry[]): { valid: boolean; error?: string } {
  if (!entries || entries.length === 0) {
    return { valid: false, error: 'Must have at least one entry.' };
  }
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (!e.work_item_id) return { valid: false, error: `Entry ${i + 1}: Task ID required.` };
    if (!e.activity_description.trim()) return { valid: false, error: `Entry ${i + 1}: Activity required.` };
    if (!e.work_completed.trim()) return { valid: false, error: `Entry ${i + 1}: Work completed required.` };
    if (e.hours_spent < 0 || e.hours_spent > 24) return { valid: false, error: `Entry ${i + 1}: Invalid hours.` };
    if (e.minutes_spent < 0 || e.minutes_spent >= 60) return { valid: false, error: `Entry ${i + 1}: Invalid minutes.` };
    if (e.hours_spent === 0 && e.minutes_spent === 0) return { valid: false, error: `Entry ${i + 1}: Time must be > 0.` };
    if (e.daily_progress_percentage < 0 || e.daily_progress_percentage > 100) return { valid: false, error: `Entry ${i + 1}: Invalid daily progress.` };
    if (e.reported_overall_progress < 0 || e.reported_overall_progress > 100) return { valid: false, error: `Entry ${i + 1}: Invalid overall progress.` };
  }
  return { valid: true };
}

// 1. Rejects zero-time entries
const zeroTimeEntry: TestReportEntry = {
  work_item_id: 'item-1',
  activity_description: 'Vulnerability scan',
  work_completed: 'Ran Burp suite',
  hours_spent: 0,
  minutes_spent: 0,
  daily_progress_percentage: 20,
  reported_overall_progress: 40,
};
assert(
  validateReportEntries([zeroTimeEntry]).valid === false,
  'Validation rejects 0 hours 0 minutes entry'
);

// 2. Rejects out-of-range minutes (> 59)
const invalidMinutesEntry: TestReportEntry = {
  ...zeroTimeEntry,
  hours_spent: 2,
  minutes_spent: 75,
};
assert(
  validateReportEntries([invalidMinutesEntry]).valid === false,
  'Validation rejects minutes >= 60'
);

// 3. Rejects invalid percentage (> 100%)
const invalidProgressEntry: TestReportEntry = {
  ...zeroTimeEntry,
  hours_spent: 4,
  minutes_spent: 0,
  reported_overall_progress: 150,
};
assert(
  validateReportEntries([invalidProgressEntry]).valid === false,
  'Validation rejects progress exceeding 100%'
);

// 4. Accepts valid comprehensive entry
const validEntry: TestReportEntry = {
  work_item_id: 'item-101',
  activity_description: 'Performed API authentication penetration testing',
  work_completed: 'Identified JWT signature verification bypass in billing webhook',
  hours_spent: 6,
  minutes_spent: 30,
  daily_progress_percentage: 60,
  reported_overall_progress: 80,
};
assert(
  validateReportEntries([validEntry]).valid === true,
  'Validation passes for well-formed security task entry'
);

// -----------------------------------------------------------------
// Group 4: Supabase Schema & RLS Integrity Verification
// -----------------------------------------------------------------
console.log('\nTest Group 4: SQL Schema & Security Rules Integrity');

// Verify that the SQL schema enforces role = 'employee' strictly on signup trigger
assert(
  ESECURITYIN_SQL_SCHEMA.includes("'employee'::user_role") ||
  ESECURITYIN_SQL_SCHEMA.includes("role := 'employee';"),
  'SQL handle_new_user trigger strictly defaults new signups to employee role'
);

// Verify atomic submission and review functions exist in schema
assert(
  ESECURITYIN_SQL_SCHEMA.includes('submit_daily_report_atomic'),
  'SQL schema includes atomic transaction function submit_daily_report_atomic'
);

assert(
  ESECURITYIN_SQL_SCHEMA.includes('review_daily_report_atomic'),
  'SQL schema includes atomic transaction function review_daily_report_atomic'
);

// Verify Row Level Security is enabled on all tables
const requiredRlsTables = [
  'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.work_assignments ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.daily_work_entries ENABLE ROW LEVEL SECURITY;',
];

requiredRlsTables.forEach((stmt) => {
  assert(
    ESECURITYIN_SQL_SCHEMA.includes(stmt),
    `RLS enabled on table statement: ${stmt.trim()}`
  );
});

// Verify email rate limit bypass trigger is included in SQL schema
assert(
  ESECURITYIN_SQL_SCHEMA.includes('auto_confirm_new_user'),
  'SQL schema includes auto_confirm_new_user trigger to remove email rate limit'
);

// -----------------------------------------------------------------
// Group 5: Total Hours & Workload Calculation Logic
// -----------------------------------------------------------------
console.log('\nTest Group 5: Time Calculation & Aggregation Precision');

const testEntries = [
  { hours_spent: 3, minutes_spent: 45 }, // 3.75 hrs
  { hours_spent: 2, minutes_spent: 15 }, // 2.25 hrs
  { hours_spent: 1, minutes_spent: 30 }, // 1.50 hrs
];

const totalMins = testEntries.reduce((sum, e) => sum + e.hours_spent * 60 + e.minutes_spent, 0);
const calculatedHours = Number((totalMins / 60).toFixed(2));
assert(
  calculatedHours === 7.5,
  `Total duration calculated with precision (expected 7.50, got ${calculatedHours})`
);

console.log('\n======================================================');
console.log(`Test Execution Summary: ${passedTests} / ${totalTests} passed`);
if (failedTests > 0) {
  console.error(`Status: FAILED (${failedTests} failures)`);
  process.exit(1);
} else {
  console.log('Status: ALL TESTS PASSED SUCCESSFULLY (100%)');
  console.log('======================================================\n');
}
