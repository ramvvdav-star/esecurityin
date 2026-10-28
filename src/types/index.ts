export type UserRole = 'admin' | 'employee';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export type ItemPriority = 'low' | 'medium' | 'high' | 'critical';

export type ItemStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'overdue';

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'reassigned';

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'revision_requested';

export interface Profile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  job_title: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  start_date: string;
  deadline?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkItem {
  id: string;
  project_id?: string | null;
  title: string;
  description?: string;
  priority: ItemPriority;
  status: ItemStatus;
  start_date: string;
  deadline?: string;
  estimated_hours: number;
  overall_progress: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed / Joined fields
  project_name?: string;
  assigned_employees?: Profile[];
}

export interface WorkAssignment {
  id: string;
  work_item_id: string;
  employee_id: string;
  assigned_by?: string;
  assigned_at: string;
  assignment_status: AssignmentStatus;
  // Joined fields
  employee?: Profile;
  work_item?: WorkItem;
}

export interface DailyReport {
  id: string;
  employee_id: string;
  report_date: string;
  status: ReportStatus;
  submitted_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Computed / Joined fields
  employee?: Profile;
  reviewer?: Profile;
  entries?: DailyWorkEntry[];
  comments?: ReportComment[];
  total_hours?: number;
}

export interface DailyWorkEntry {
  id: string;
  daily_report_id: string;
  work_item_id: string;
  activity_description: string;
  work_completed: string;
  hours_spent: number;
  minutes_spent: number;
  daily_progress_percentage: number;
  reported_overall_progress: number;
  blockers?: string;
  next_steps?: string;
  deliverable_url?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  work_item?: WorkItem;
}

export interface ProgressHistory {
  id: string;
  work_item_id: string;
  employee_id: string;
  previous_progress: number;
  new_progress: number;
  change_description?: string;
  source_daily_entry_id?: string;
  created_at: string;
  // Joined fields
  employee?: Profile;
}

export interface ReportComment {
  id: string;
  daily_report_id: string;
  author_id: string;
  comment: string;
  created_at: string;
  // Joined fields
  author?: Profile;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
  // Joined fields
  actor?: Profile;
}

export interface DashboardStats {
  totalActiveEmployees: number;
  totalProjects: number;
  totalWorkItems: number;
  reportsSubmittedToday: number;
  missingReportsToday: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalHoursReportedToday: number;
  employeeWorkloads: {
    employeeId: string;
    employeeName: string;
    assignedTasksCount: number;
    hoursReportedThisWeek: number;
    completionRate: number;
  }[];
}
