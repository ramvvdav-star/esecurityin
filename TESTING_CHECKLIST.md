# eSecurityIn Employee Task Tracker — Comprehensive Testing Checklist

This checklist provides a structured matrix for verifying all functional, administrative, and security requirements of the eSecurityIn task management system.

---

## 1. Authentication & Session Security

- [ ] **Email & Password Login:**
  - Login with valid credentials succeeds and loads user session immediately.
  - Login with invalid password displays safe, descriptive error message.
  - Inactive employee account cannot log in or perform protected actions.
- [ ] **Password Reset:**
  - Password reset request sends Supabase recovery email.
  - Deep link recovery redirects user to new password formulation form.
- [ ] **Session Persistence & Refresh:**
  - Session persists across page reloads and browser restarts using Supabase JWT.
  - Expired tokens refresh automatically in background.
- [ ] **Protected Routes:**
  - Accessing `/admin/*` unauthenticated redirects to `/login`.
  - Non-admin employee attempting to view admin routes is prevented.
  - Logout terminates the active session, clears storage tokens, and redirects to `/login`.

---

## 2. Admin Capabilities & Project Management

- [ ] **Admin Dashboard Overview:**
  - Active employee count accurately reflects active status in `profiles`.
  - Projects count and Work Items count update live.
  - Status breakdown (Completed, In Progress, Pending, Overdue) matches database records.
  - Missing daily report indicator lists employees who haven't filed today.
- [ ] **Project Creation & Subtask Breakdown:**
  - Admin can create a new project with title, description, client scope, start date, and deadline.
  - Admin can break down projects into granular subtasks (e.g. Auth testing, Vulnerability assessment, Reporting).
  - Standalone tasks (tasks not tied to any project) can be created with `project_id = NULL`.
- [ ] **Multi-Employee Assignment:**
  - Multiple employees can be assigned to different tasks within the same project.
  - Assigning the same employee twice to the same task is blocked by database constraint `unique_work_item_employee`.
  - Admin can change priorities (`low`, `medium`, `high`, `critical`), deadlines, and statuses (`in_progress`, `on_hold`, `completed`).
  - Archiving a project preserves historical daily reports and audit records.

---

## 3. Employee Daily Work Report Workflow

- [ ] **Date & Work Item Selection:**
  - Employee can pick a report date (defaults to today).
  - Task selector only shows work items assigned to this employee.
- [ ] **Work Entry Composition:**
  - Employee adds activity description and specific work completed.
  - Time spent is validated (positive hours & minutes, maximum 24h per day).
  - Progress slider allows reporting current progress (0 - 100%).
  - Optional deliverable URL, blockers, and next steps fields record accurately.
- [ ] **Draft vs. Submission Lifecycle:**
  - Employee can "Save as Draft" without notifying admin or locking the form.
  - Draft reports can be edited and new entries can be added or removed.
  - Clicking "Submit Report" transitions status to `submitted` and timestamps `submitted_at`.
  - Submitted reports become read-only for the employee unless revision is requested.
  - Duplicate submissions for the same employee on the same date are rejected by constraint `unique_employee_report_date`.

---

## 4. Admin Review, Comments & Analytics

- [ ] **Admin Report Review Queue:**
  - Filter reports by status (`submitted`, `revision_requested`, `approved`, `draft`), department, employee, and date.
  - Admin can inspect detailed entries, hours logged, and deliverables.
  - Admin can click **Approve** (sets status to `approved`, stamps `reviewed_by` and `reviewed_at`).
  - Admin can click **Request Revision** with mandatory feedback comment.
- [ ] **Employee Revision Handling:**
  - Employee receives notification of revision request with admin feedback.
  - Employee can modify entries, address feedback, and re-submit.
- [ ] **Analytics & Reporting:**
  - Total time logged per employee per week/month visualized in bar/line charts.
  - Task completion velocity and workload distribution metrics.
  - CSV export downloads clean dataset of submitted work reports and hours for payroll and audit.

---

## 5. Row-Level Security (RLS) & Anti-Tamper Verification

- [ ] **Employee Data Isolation:**
  - Employee query `SELECT * FROM public.daily_reports;` returns ONLY reports where `employee_id = auth.uid()`.
  - Employee cannot read other employees' draft or submitted reports via direct Supabase API call.
- [ ] **Privilege Escalation Prevention:**
  - Attempting `UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();` from browser console fails due to RLS WITH CHECK constraint.
- [ ] **Self-Approval Prevention:**
  - Attempting `UPDATE public.daily_reports SET status = 'approved' WHERE employee_id = auth.uid();` fails.
- [ ] **Arbitrary Assignment Prevention:**
  - Non-admin employee attempting `INSERT INTO public.work_assignments` receives permission denied error.
- [ ] **Audit Trail:**
  - Major actions (approvals, revisions, project changes, employee status changes) write immutable records to `audit_logs`.
  - `audit_logs` are accessible exclusively to users with `role = 'admin'`.
