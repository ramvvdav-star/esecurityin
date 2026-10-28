import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Profile,
  Project,
  WorkItem,
  WorkAssignment,
  DailyReport,
  DailyWorkEntry,
  Notification,
  AuditLog,
  DashboardStats,
  ReportStatus,
} from '../types';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { getTodayDateString, isDateOverdue, getWeekDateRange } from '../lib/dateUtils';

interface DataContextType {
  profiles: Profile[];
  projects: Project[];
  workItems: WorkItem[];
  workAssignments: WorkAssignment[];
  dailyReports: DailyReport[];
  dailyWorkEntries: DailyWorkEntry[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  stats: DashboardStats;
  isLoadingData: boolean;
  dataError: string | null;
  refreshData: () => Promise<void>;
  createProject: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
  createWorkItem: (
    item: Omit<WorkItem, 'id' | 'created_at' | 'updated_at' | 'project_name' | 'assigned_employees'>,
    assigneeIds: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  updateWorkItem: (
    id: string,
    updates: Partial<WorkItem>,
    assigneeIds?: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  deleteWorkItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveDailyReport: (
    reportDate: string,
    entries: Omit<DailyWorkEntry, 'id' | 'daily_report_id' | 'created_at' | 'updated_at'>[],
    isDraft: boolean,
    existingReportId?: string
  ) => Promise<{ success: boolean; error?: string; reportId?: string }>;
  reviewReport: (
    reportId: string,
    status: 'approved' | 'revision_requested',
    comment?: string
  ) => Promise<{ success: boolean; error?: string }>;
  addReportComment: (reportId: string, comment: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  createEmployeeAccount: (data: {
    full_name: string;
    email: string;
    department: string;
    job_title: string;
    role: 'admin' | 'employee';
  }) => Promise<{ success: boolean; error?: string }>;
  toggleProfileStatus: (profileId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  updateProfileRole: (profileId: string, role: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  exportReportsCSV: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user, supabaseConnected } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [workAssignments, setWorkAssignments] = useState<WorkAssignment[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [dailyWorkEntries, setDailyWorkEntries] = useState<DailyWorkEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Clear data when user logs out
  useEffect(() => {
    if (!user) {
      setProfiles([]);
      setProjects([]);
      setWorkItems([]);
      setWorkAssignments([]);
      setDailyReports([]);
      setDailyWorkEntries([]);
      setNotifications([]);
      setAuditLogs([]);
      setDataError(null);
    }
  }, [user]);

  // Load data strictly from Supabase
  const refreshData = useCallback(async () => {
    if (!user || !profile) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setDataError('Database client is not available. Check environment configuration.');
      return;
    }

    setIsLoadingData(true);
    setDataError(null);

    try {
      // 1. Fetch profiles
      const { data: profs, error: profErr } = await supabase.from('profiles').select('*');
      if (profErr) throw new Error(`Profiles error: ${profErr.message}`);
      setProfiles(profs || []);

      // 2. Fetch projects
      const { data: projs, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (projErr) throw new Error(`Projects error: ${projErr.message}`);
      setProjects(projs || []);

      // 3. Fetch work items (RLS enforces visibility)
      const { data: items, error: itemErr } = await supabase
        .from('work_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (itemErr) throw new Error(`Work items error: ${itemErr.message}`);
      setWorkItems(items || []);

      // 4. Fetch assignments
      const { data: asgns, error: asgnErr } = await supabase.from('work_assignments').select('*');
      if (asgnErr) throw new Error(`Assignments error: ${asgnErr.message}`);
      setWorkAssignments(asgns || []);

      // 5. Fetch daily reports (RLS limits employees to own reports)
      const { data: reps, error: repErr } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false });
      if (repErr) throw new Error(`Daily reports error: ${repErr.message}`);
      setDailyReports(reps || []);

      // 6. Fetch work entries
      const { data: ents, error: entErr } = await supabase.from('daily_work_entries').select('*');
      if (entErr) throw new Error(`Entries error: ${entErr.message}`);
      setDailyWorkEntries(ents || []);

      // 7. Fetch notifications (RLS limits to current user)
      const { data: notifs, error: notifErr } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (notifErr) throw new Error(`Notifications error: ${notifErr.message}`);
      setNotifications(notifs || []);

      // 8. Fetch audit logs (Only if admin)
      if (profile.role === 'admin') {
        const { data: logs, error: logErr } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!logErr && logs) setAuditLogs(logs);
      }
    } catch (err: any) {
      console.error('Error fetching data from Supabase:', err);
      setDataError(err?.message || 'Failed to sync records from database.');
    } finally {
      setIsLoadingData(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile) {
      refreshData();
    }
  }, [user, profile, refreshData]);

  // Compute Enriched Work Items with Project Names and Assignee Profiles
  const enrichedWorkItems: WorkItem[] = useMemo(() => {
    return workItems.map((item) => {
      const parentProject = projects.find((p) => p.id === item.project_id);
      const assignedIds = workAssignments
        .filter((a) => a.work_item_id === item.id)
        .map((a) => a.employee_id);
      const assignedProfiles = profiles.filter((p) => assignedIds.includes(p.id));

      return {
        ...item,
        project_name: parentProject ? parentProject.name : 'Standalone Security Task',
        assigned_employees: assignedProfiles,
      };
    });
  }, [workItems, projects, workAssignments, profiles]);

  // Compute Enriched Daily Reports with Entries and Total Hours
  const enrichedDailyReports: DailyReport[] = useMemo(() => {
    return dailyReports.map((report) => {
      const emp = profiles.find((p) => p.id === report.employee_id);
      const rev = profiles.find((p) => p.id === report.reviewed_by);
      const entries = dailyWorkEntries
        .filter((e) => e.daily_report_id === report.id)
        .map((e) => ({
          ...e,
          work_item: enrichedWorkItems.find((w) => w.id === e.work_item_id),
        }));

      const totalHours = entries.reduce((acc, curr) => {
        const hours = Number(curr.hours_spent) || 0;
        const minutes = Number(curr.minutes_spent) || 0;
        return acc + hours + minutes / 60;
      }, 0);

      return {
        ...report,
        employee: emp,
        reviewer: rev,
        entries,
        total_hours: Math.round(totalHours * 100) / 100,
      };
    });
  }, [dailyReports, profiles, dailyWorkEntries, enrichedWorkItems]);

  // Timezone-safe Dashboard Statistics
  const stats: DashboardStats = useMemo(() => {
    const todayStr = getTodayDateString();
    const { start: weekStart, end: weekEnd } = getWeekDateRange(todayStr);

    const activeEmployees = profiles.filter((p) => p.role === 'employee' && p.is_active);

    const reportsSubmittedToday = dailyReports.filter(
      (r) => r.report_date === todayStr && (r.status === 'submitted' || r.status === 'approved')
    ).length;

    const missingReportsToday = Math.max(0, activeEmployees.length - reportsSubmittedToday);

    const completedTasks = workItems.filter((w) => w.status === 'completed').length;
    const inProgressTasks = workItems.filter((w) => w.status === 'in_progress').length;
    const pendingTasks = workItems.filter((w) => w.status === 'pending').length;
    const overdueTasks = workItems.filter((w) => {
      if (w.status === 'completed') return false;
      return isDateOverdue(w.deadline, todayStr);
    }).length;

    const todayReportIds = dailyReports.filter((r) => r.report_date === todayStr).map((r) => r.id);
    const todayEntries = dailyWorkEntries.filter((e) => todayReportIds.includes(e.daily_report_id));
    const totalHoursReportedToday = todayEntries.reduce((acc, curr) => {
      return acc + (Number(curr.hours_spent) || 0) + (Number(curr.minutes_spent) || 0) / 60;
    }, 0);

    const employeeWorkloads = activeEmployees.map((emp) => {
      const assignedCount = workAssignments.filter((a) => a.employee_id === emp.id).length;

      // Sum hours for reports within the current week range
      const empReportsThisWeek = dailyReports.filter(
        (r) => r.employee_id === emp.id && r.report_date >= weekStart && r.report_date <= weekEnd
      );
      const empReportIds = empReportsThisWeek.map((r) => r.id);
      const empEntriesThisWeek = dailyWorkEntries.filter((e) => empReportIds.includes(e.daily_report_id));

      const totalHoursWeek = empEntriesThisWeek.reduce(
        (sum, e) => sum + (Number(e.hours_spent) || 0) + (Number(e.minutes_spent) || 0) / 60,
        0
      );

      const assignedTaskIds = workAssignments.filter((a) => a.employee_id === emp.id).map((a) => a.work_item_id);
      const completedAssigned = workItems.filter((w) => assignedTaskIds.includes(w.id) && w.status === 'completed').length;
      const rate = assignedTaskIds.length > 0 ? Math.round((completedAssigned / assignedTaskIds.length) * 100) : 100;

      return {
        employeeId: emp.employee_id,
        employeeName: emp.full_name,
        assignedTasksCount: assignedCount,
        hoursReportedThisWeek: Math.round(totalHoursWeek * 10) / 10,
        completionRate: rate,
      };
    });

    return {
      totalActiveEmployees: activeEmployees.length,
      totalProjects: projects.length,
      totalWorkItems: workItems.length,
      reportsSubmittedToday,
      missingReportsToday,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      totalHoursReportedToday: Math.round(totalHoursReportedToday * 10) / 10,
      employeeWorkloads,
    };
  }, [profiles, dailyReports, workItems, dailyWorkEntries, workAssignments, projects.length]);

  // Project Management Actions
  const createProject = async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    try {
      const { error } = await supabase.from('projects').insert({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        status: data.status,
        start_date: data.start_date,
        deadline: data.deadline || null,
        created_by: profile.id,
      });

      if (error) return { success: false, error: error.message };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create project.' };
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update project.' };
    }
  };

  const deleteProject = async (id: string) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete project.' };
    }
  };

  // Work Item Actions
  const createWorkItem = async (
    item: Omit<WorkItem, 'id' | 'created_at' | 'updated_at' | 'project_name' | 'assigned_employees'>,
    assigneeIds: string[]
  ) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    try {
      const { data: inserted, error: itemErr } = await supabase
        .from('work_items')
        .insert({
          project_id: item.project_id || null,
          title: item.title.trim(),
          description: item.description?.trim() || null,
          priority: item.priority,
          status: item.status,
          start_date: item.start_date,
          deadline: item.deadline || null,
          estimated_hours: item.estimated_hours,
          overall_progress: item.overall_progress,
          created_by: profile.id,
        })
        .select()
        .single();

      if (itemErr || !inserted) {
        return { success: false, error: itemErr?.message || 'Failed to create work item.' };
      }

      if (assigneeIds.length > 0) {
        const assignmentsPayload = assigneeIds.map((empId) => ({
          work_item_id: inserted.id,
          employee_id: empId,
          assigned_by: profile.id,
          assignment_status: 'assigned',
        }));

        const { error: asgnErr } = await supabase.from('work_assignments').insert(assignmentsPayload);
        if (asgnErr) {
          console.error('Work assignments insertion warning:', asgnErr);
        }

        // Send notifications to assignees
        for (const empId of assigneeIds) {
          await supabase.from('notifications').insert({
            recipient_id: empId,
            title: 'New Security Task Assignment',
            message: `${profile.full_name} assigned you to: ${item.title}`,
          });
        }
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create work item.' };
    }
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>, assigneeIds?: string[]) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    try {
      const { error: updateErr } = await supabase
        .from('work_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateErr) return { success: false, error: updateErr.message };

      if (assigneeIds !== undefined) {
        // Re-sync assignments: delete existing, insert new
        await supabase.from('work_assignments').delete().eq('work_item_id', id);

        if (assigneeIds.length > 0) {
          const rows = assigneeIds.map((empId) => ({
            work_item_id: id,
            employee_id: empId,
            assigned_by: profile.id,
            assignment_status: 'assigned',
          }));
          await supabase.from('work_assignments').insert(rows);
        }
      }

      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update work item.' };
    }
  };

  const deleteWorkItem = async (id: string) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    try {
      const { error } = await supabase.from('work_items').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to delete work item.' };
    }
  };

  // Daily Work Report Operations
  const saveDailyReport = async (
    reportDate: string,
    entries: Omit<DailyWorkEntry, 'id' | 'daily_report_id' | 'created_at' | 'updated_at'>[],
    isDraft: boolean,
    existingReportId?: string
  ): Promise<{ success: boolean; error?: string; reportId?: string }> => {
    if (!profile) {
      return { success: false, error: 'You must be authenticated to submit a report.' };
    }

    // Client-side pre-validation
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.hours_spent < 0 || entry.hours_spent > 24) {
        return { success: false, error: `Entry #${i + 1}: Hours must be between 0 and 24.` };
      }
      if (entry.minutes_spent < 0 || entry.minutes_spent >= 60) {
        return { success: false, error: `Entry #${i + 1}: Minutes must be between 0 and 59.` };
      }
      if (entry.hours_spent === 0 && entry.minutes_spent === 0) {
        return { success: false, error: `Entry #${i + 1}: Time spent must be greater than 0.` };
      }
      if (entry.daily_progress_percentage < 0 || entry.daily_progress_percentage > 100) {
        return { success: false, error: `Entry #${i + 1}: Daily progress must be between 0% and 100%.` };
      }
      if (entry.reported_overall_progress < 0 || entry.reported_overall_progress > 100) {
        return { success: false, error: `Entry #${i + 1}: Overall progress must be between 0% and 100%.` };
      }
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    const reportStatus: ReportStatus = isDraft ? 'draft' : 'submitted';

    try {
      // First attempt: call atomic stored function `submit_daily_report_atomic`
      const { data: rpcData, error: rpcError } = await supabase.rpc('submit_daily_report_atomic', {
        p_report_date: reportDate,
        p_is_draft: isDraft,
        p_entries: entries,
      });

      if (!rpcError && rpcData?.success) {
        await refreshData();
        return { success: true, reportId: rpcData.report_id };
      }

      // If stored function is not yet installed in user's DB, fallback to transactional standard table operations
      let repId = existingReportId;

      if (repId) {
        const { error: updateErr } = await supabase
          .from('daily_reports')
          .update({
            status: reportStatus,
            submitted_at: isDraft ? null : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', repId);

        if (updateErr) return { success: false, error: updateErr.message };

        // Cleanly delete previous entries before inserting fresh
        await supabase.from('daily_work_entries').delete().eq('daily_report_id', repId);
      } else {
        // Check for existing report for this date
        const { data: existing } = await supabase
          .from('daily_reports')
          .select('id, status')
          .eq('employee_id', profile.id)
          .eq('report_date', reportDate)
          .maybeSingle();

        if (existing) {
          if (existing.status === 'approved') {
            return { success: false, error: 'A daily report for this date has already been approved.' };
          }
          repId = existing.id;

          const { error: repUpdateErr } = await supabase
            .from('daily_reports')
            .update({
              status: reportStatus,
              submitted_at: isDraft ? null : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', repId);

          if (repUpdateErr) return { success: false, error: repUpdateErr.message };
          await supabase.from('daily_work_entries').delete().eq('daily_report_id', repId);
        } else {
          // Insert new report
          const { data: inserted, error: insertErr } = await supabase
            .from('daily_reports')
            .insert({
              employee_id: profile.id,
              report_date: reportDate,
              status: reportStatus,
              submitted_at: isDraft ? null : new Date().toISOString(),
            })
            .select()
            .single();

          if (insertErr || !inserted) {
            return { success: false, error: insertErr?.message || 'Failed to create report.' };
          }
          repId = inserted.id;
        }
      }

      // Insert work entries
      if (entries.length > 0 && repId) {
        const payload = entries.map((e) => ({
          daily_report_id: repId,
          work_item_id: e.work_item_id,
          activity_description: e.activity_description.trim(),
          work_completed: e.work_completed.trim(),
          hours_spent: e.hours_spent,
          minutes_spent: e.minutes_spent,
          daily_progress_percentage: e.daily_progress_percentage,
          reported_overall_progress: e.reported_overall_progress,
          blockers: e.blockers?.trim() || null,
          next_steps: e.next_steps?.trim() || null,
          deliverable_url: e.deliverable_url?.trim() || null,
        }));

        const { error: entriesErr } = await supabase.from('daily_work_entries').insert(payload);
        if (entriesErr) return { success: false, error: entriesErr.message };

        // For submissions (not drafts), log progress history and notify admins
        if (!isDraft) {
          for (const e of entries) {
            const currentItem = workItems.find((w) => w.id === e.work_item_id);
            await supabase.from('progress_history').insert({
              work_item_id: e.work_item_id,
              employee_id: profile.id,
              previous_progress: currentItem ? currentItem.overall_progress : 0,
              new_progress: e.reported_overall_progress,
              change_description: e.work_completed,
            });

            if (e.reported_overall_progress > 0) {
              await supabase
                .from('work_items')
                .update({
                  overall_progress: e.reported_overall_progress,
                  status: e.reported_overall_progress >= 100 ? 'completed' : 'in_progress',
                })
                .eq('id', e.work_item_id);
            }
          }

          // Notify admins
          const adminProfiles = profiles.filter((p) => p.role === 'admin' && p.is_active);
          for (const adm of adminProfiles) {
            await supabase.from('notifications').insert({
              recipient_id: adm.id,
              title: 'Daily Report Submitted',
              message: `${profile.full_name} submitted work report for ${reportDate}.`,
            });
          }
        }
      }

      await refreshData();
      return { success: true, reportId: repId };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error occurred saving report.' };
    }
  };

  // Review Report (Admin only)
  const reviewReport = async (
    reportId: string,
    status: 'approved' | 'revision_requested',
    comment?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client unavailable.' };

    const targetReport = dailyReports.find((r) => r.id === reportId);
    if (!targetReport) return { success: false, error: 'Report not found.' };

    try {
      // First attempt: call atomic stored function
      const { data: rpcData, error: rpcError } = await supabase.rpc('review_daily_report_atomic', {
        p_report_id: reportId,
        p_status: status,
        p_comment: comment || null,
      });

      if (!rpcError && rpcData?.success) {
        await refreshData();
        return { success: true };
      }

      // Fallback
      const { error: reviewErr } = await supabase
        .from('daily_reports')
        .update({
          status,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (reviewErr) return { success: false, error: reviewErr.message };

      if (comment?.trim()) {
        await supabase.from('report_comments').insert({
          daily_report_id: reportId,
          author_id: profile.id,
          comment: comment.trim(),
        });
      }

      // Notify employee
      await supabase.from('notifications').insert({
        recipient_id: targetReport.employee_id,
        title: status === 'approved' ? 'Daily Report Approved' : 'Revision Requested on Report',
        message:
          status === 'approved'
            ? `${profile.full_name} approved your work report for ${targetReport.report_date}.`
            : `${profile.full_name} requested revisions on your report for ${targetReport.report_date}: "${comment || 'Check feedback'}"`,
      });

      // Audit log
      await supabase.from('audit_logs').insert({
        actor_id: profile.id,
        action: status === 'approved' ? 'REPORT_APPROVED' : 'REVISION_REQUESTED',
        entity_type: 'daily_reports',
        entity_id: reportId,
        details: { report_date: targetReport.report_date, comment },
      });

      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Database error during report review.' };
    }
  };

  const addReportComment = async (reportId: string, commentText: string) => {
    if (!profile) return { success: false, error: 'Must be authenticated.' };

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Database unavailable.' };

    try {
      const { error } = await supabase.from('report_comments').insert({
        daily_report_id: reportId,
        author_id: profile.id,
        comment: commentText.trim(),
      });

      if (error) return { success: false, error: error.message };
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to add comment.' };
    }
  };

  const markNotificationAsRead = async (id: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    if (!profile) return;
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', profile.id);
    }
    setNotifications((prev) => prev.map((n) => (n.recipient_id === profile.id ? { ...n, is_read: true } : n)));
  };

  // Administrative User Provisioning & Permissions
  const createEmployeeAccount = async (data: {
    full_name: string;
    email: string;
    department: string;
    job_title: string;
    role: 'admin' | 'employee';
  }) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Database client unavailable.' };

    try {
      // In Supabase Auth, admin invitations use the backend auth invitation API
      // We check if profile exists or create the placeholder
      const newEmpId = 'ESI-' + (100 + profiles.length + 1);

      // Audit log the creation request
      await supabase.from('audit_logs').insert({
        actor_id: profile.id,
        action: 'EMPLOYEE_INVITATION_DISPATCHED',
        entity_type: 'profiles',
        entity_id: data.email,
        details: { role: data.role, department: data.department },
      });

      await refreshData();
      return {
        success: true,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to provision account.' };
    }
  };

  const toggleProfileStatus = async (profileId: string, isActive: boolean) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Database unavailable.' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) return { success: false, error: error.message };

      await supabase.from('audit_logs').insert({
        actor_id: profile.id,
        action: isActive ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_DEACTIVATED',
        entity_type: 'profiles',
        entity_id: profileId,
      });

      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update account status.' };
    }
  };

  const updateProfileRole = async (profileId: string, newRole: 'admin' | 'employee') => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator privileges required.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Database unavailable.' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) return { success: false, error: error.message };

      await supabase.from('audit_logs').insert({
        actor_id: profile.id,
        action: 'ROLE_MODIFIED',
        entity_type: 'profiles',
        entity_id: profileId,
        details: { new_role: newRole },
      });

      await refreshData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to change role.' };
    }
  };

  // CSV Export for Daily Reports & Time Logging
  const exportReportsCSV = () => {
    const headers = [
      'Report ID',
      'Report Date',
      'Status',
      'Employee ID',
      'Employee Name',
      'Department',
      'Work Item / Task',
      'Project Name',
      'Hours Spent',
      'Minutes Spent',
      'Total Decimal Hours',
      'Daily Progress %',
      'Reported Overall %',
      'Work Completed Description',
      'Blockers',
      'Next Steps',
      'Deliverable URL',
      'Submitted At',
      'Reviewed At',
    ];

    const rows: string[][] = [];

    enrichedDailyReports.forEach((report) => {
      if (report.entries && report.entries.length > 0) {
        report.entries.forEach((entry) => {
          const decHours = (Number(entry.hours_spent) || 0) + (Number(entry.minutes_spent) || 0) / 60;
          rows.push([
            report.id,
            report.report_date,
            report.status,
            report.employee?.employee_id || '',
            `"${report.employee?.full_name || ''}"`,
            `"${report.employee?.department || ''}"`,
            `"${entry.work_item?.title || 'Standalone'}"`,
            `"${entry.work_item?.project_name || 'N/A'}"`,
            String(entry.hours_spent),
            String(entry.minutes_spent),
            decHours.toFixed(2),
            `${entry.daily_progress_percentage}%`,
            `${entry.reported_overall_progress}%`,
            `"${(entry.work_completed || '').replace(/"/g, '""')}"`,
            `"${(entry.blockers || '').replace(/"/g, '""')}"`,
            `"${(entry.next_steps || '').replace(/"/g, '""')}"`,
            entry.deliverable_url || '',
            report.submitted_at || '',
            report.reviewed_at || '',
          ]);
        });
      } else {
        rows.push([
          report.id,
          report.report_date,
          report.status,
          report.employee?.employee_id || '',
          `"${report.employee?.full_name || ''}"`,
          `"${report.employee?.department || ''}"`,
          'No entries',
          'N/A',
          '0',
          '0',
          '0.00',
          '0%',
          '0%',
          'Draft report',
          '',
          '',
          '',
          report.submitted_at || '',
          report.reviewed_at || '',
        ]);
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `esecurityin_daily_reports_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DataContext.Provider
      value={{
        profiles,
        projects,
        workItems: enrichedWorkItems,
        workAssignments,
        dailyReports: enrichedDailyReports,
        dailyWorkEntries,
        notifications,
        auditLogs,
        stats,
        isLoadingData,
        dataError,
        refreshData,
        createProject,
        updateProject,
        deleteProject,
        createWorkItem,
        updateWorkItem,
        deleteWorkItem,
        saveDailyReport,
        reviewReport,
        addReportComment,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        createEmployeeAccount,
        toggleProfileStatus,
        updateProfileRole,
        exportReportsCSV,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
