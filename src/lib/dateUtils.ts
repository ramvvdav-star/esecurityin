/**
 * Timezone-safe date utilities for eSecurityIn Task Tracker.
 * Prevents UTC conversion drift from altering business dates.
 */

// Default company operating timezone or user local timezone
export const COMPANY_TIMEZONE = 'UTC';

/**
 * Returns today's date in YYYY-MM-DD format without UTC date shifting.
 * Can accept an optional Date object or timezone string.
 */
export function getTodayDateString(dateOrTimezone?: Date | string): string {
  const d = dateOrTimezone instanceof Date ? dateOrTimezone : new Date();
  const tz = typeof dateOrTimezone === 'string' ? dateOrTimezone : undefined;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Safely parses a YYYY-MM-DD date into year, month, day components
 * avoiding timezone offset changes.
 */
export function parseDateComponents(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Formats a YYYY-MM-DD date string for friendly display (e.g., "Oct 27, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  const components = parseDateComponents(dateStr);
  if (!components) return dateStr || '';
  // Construct date at noon local time to avoid boundary shifts
  const d = new Date(components.year, components.month - 1, components.day, 12, 0, 0);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Checks if a target YYYY-MM-DD date is strictly in the past compared to today.
 */
export function isDateOverdue(deadlineStr: string | null | undefined, todayStr = getTodayDateString()): boolean {
  if (!deadlineStr) return false;
  return deadlineStr < todayStr;
}

/**
 * Calculates start and end of week (Monday to Sunday) for a given date string.
 */
export function getWeekDateRange(dateStr = getTodayDateString()): { start: string; end: string } {
  const comp = parseDateComponents(dateStr);
  if (!comp) return { start: dateStr, end: dateStr };

  const current = new Date(comp.year, comp.month - 1, comp.day, 12, 0, 0);
  const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(current);
  monday.setDate(current.getDate() - distanceToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    start: format(monday),
    end: format(sunday),
  };
}

/**
 * Checks if a date string falls within the last N days.
 */
export function isWithinPastDays(dateStr: string, days: number, todayStr = getTodayDateString()): boolean {
  const compDate = parseDateComponents(dateStr);
  const compToday = parseDateComponents(todayStr);
  if (!compDate || !compToday) return false;

  const target = new Date(compDate.year, compDate.month - 1, compDate.day).getTime();
  const today = new Date(compToday.year, compToday.month - 1, compToday.day).getTime();

  const diffMs = today - target;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= days;
}
