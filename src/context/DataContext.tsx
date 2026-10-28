import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
import {
  INITIAL_PROFILES,
  INITIAL_PROJECTS,
  INITIAL_WORK_ITEMS,
  INITIAL_ASSIGNMENTS,
  INITIAL_DAILY_REPORTS,
  INITIAL_DAILY_WORK_ENTRIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../lib/demoData';

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

// LocalStorage cache keys for demo mode continuity
const DEMO_STORE_PREFIX = 'esecurityin_store_';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isDemoMode, supabaseConnected } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [workItems, setWorkItems] = useState<WorkItem[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'work_items');
    return saved ? JSON.parse(saved) : INITIAL_WORK_ITEMS;
  });

  const [workAssignments, setWorkAssignments] = useState<WorkAssignment[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'assignments');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'daily_reports');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_REPORTS;
  });

  const [dailyWorkEntries, setDailyWorkEntries] = useState<DailyWorkEntry[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'work_entries');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_WORK_ENTRIES;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(DEMO_STORE_PREFIX + 'audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Sync state to LocalStorage in demo mode
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(DEMO_STORE_PREFIX + 'profiles', JSON.stringify(profiles));
      localStorage.setItem(DEMO_STORE_PREFIX + 'projects', JSON.stringify(projects));
      localStorage.setItem(DEMO_STORE_PREFIX + 'work_items', JSON.stringify(workItems));
      localStorage.setItem(DEMO_STORE_PREFIX + 'assignments', JSON.stringify(workAssignments));
      localStorage.setItem(DEMO_STORE_PREFIX + 'daily_reports', JSON.stringify(dailyReports));
      localStorage.setItem(DEMO_STORE_PREFIX + 'work_entries', JSON.stringify(dailyWorkEntries));
      localStorage.setItem(DEMO_STORE_PREFIX + 'notifications', JSON.stringify(notifications));
      localStorage.setItem(DEMO_STORE_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
    }
  }, [profiles, projects, workItems, workAssignments, dailyReports, dailyWorkEntries, notifications, auditLogs, isDemoMode]);

  // Load live data from Supabase if connected
  const refreshData = useCallback(async () => {
    if (isDemoMode || !supabaseConnected) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setIsLoadingData(true);
    try {
      // 1. Fetch profiles
      const { data: profs } = await supabase.from('profiles').select('*');
      if (profs) setProfiles(profs);

      // 2. Fetch projects
      const { data: projs } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (projs) setProjects(projs);

      // 3. Fetch work items
      const { data: items } = await supabase.from('work_items').select('*').order('created_at', { ascending: false });
      if (items) setWorkItems(items);

      // 4. Fetch assignments
      const { data: asgns } = await supabase.from('work_assignments').select('*');
      if (asgns) setWorkAssignments(asgns);

      // 5. Fetch daily reports
      const { data: reps } = await supabase.from('daily_reports').select('*, report_comments(*)').order('report_date', { ascending: false });
      if (reps) setDailyReports(reps);

      // 6. Fetch entries
      const { data: ents } = await supabase.from('daily_work_entries').select('*');
      if (ents) setDailyWorkEntries(ents);

      // 7. Fetch notifications
      const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (notifs) setNotifications(notifs);

      // 8. Fetch audit logs (if admin)
      if (profile?.role === 'admin') {
        const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (logs) setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [isDemoMode, supabaseConnected, profile?.role]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Compute Enriched Work Items with Project Names and Assignee Avatars
  const enrichedWorkItems: WorkItem[] = workItems.map((item) => {
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

  // Compute Enriched Daily Reports with Entries and Total Hours
  const enrichedDailyReports: DailyReport[] = dailyReports.map((report) => {
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

  // Compute Dashboard Statistics
  const todayStr = new Date().toISOString().split('T')[0];
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
    if (!w.deadline) return false;
    return new Date(w.deadline) < new Date(todayStr);
  }).length;

  const todayEntries = dailyWorkEntries.filter((e) => {
    const parentReport = dailyReports.find((r) => r.id === e.daily_report_id);
    return parentReport?.report_date === todayStr;
  });
  const totalHoursReportedToday = todayEntries.reduce((acc, curr) => {
    return acc + (Number(curr.hours_spent) || 0) + (Number(curr.minutes_spent) || 0) / 60;
  }, 0);

  const employeeWorkloads = activeEmployees.map((emp) => {
    const assignedCount = workAssignments.filter((a) => a.employee_id === emp.id).length;
    // Calculate hours logged across all reports in the last 7 days
    const empReports = dailyReports.filter((r) => r.employee_id === emp.id);
    const empEntries = dailyWorkEntries.filter((e) => empReports.some((r) => r.id === e.daily_report_id));
    const totalHours = empEntries.reduce((sum, e) => sum + (Number(e.hours_spent) || 0) + (Number(e.minutes_spent) || 0) / 60, 0);

    // Completion rate of tasks assigned to this employee
    const assignedTaskIds = workAssignments.filter((a) => a.employee_id === emp.id).map((a) => a.work_item_id);
    const completedAssigned = workItems.filter((w) => assignedTaskIds.includes(w.id) && w.status === 'completed').length;
    const rate = assignedTaskIds.length > 0 ? Math.round((completedAssigned / assignedTaskIds.length) * 100) : 100;

    return {
      employeeId: emp.employee_id,
      employeeName: emp.full_name,
      assignedTasksCount: assignedCount,
      hoursReportedThisWeek: Math.round(totalHours * 10) / 10,
      completionRate: rate,
    };
  });

  const stats: DashboardStats = {
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

  // Helper for audit logs
  const logAudit = (action: string, entityType: string, entityId: string, details?: any) => {
    const newLog: AuditLog = {
      id: 'audit_' + Date.now() + Math.random().toString(36).substring(2, 5),
      actor_id: profile?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
      actor: profile || undefined,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Send to Supabase if live
    const supabase = getSupabaseClient();
    if (!isDemoMode && supabase && supabaseConnected) {
      supabase.from('audit_logs').insert({
        actor_id: profile?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      }).then();
    }
  };

  // Project Management Actions
  const createProject = async (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin role required to create projects.' };
    }

    const newId = 'proj_' + Date.now();
    const newProj: Project = {
      ...data,
      id: newId,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('projects').insert({
          name: data.name,
          description: data.description,
          status: data.status,
          start_date: data.start_date,
          deadline: data.deadline,
          created_by: profile.id,
        });
        if (error) return { success: false, error: error.message };
        await refreshData();
      }
    } else {
      setProjects((prev) => [newProj, ...prev]);
    }

    logAudit('PROJECT_CREATED', 'projects', newId, { name: data.name });
    return { success: true };
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('projects').update(updates).eq('id', id);
        if (error) return { success: false, error: error.message };
        await refreshData();
      }
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
      );
    }

    logAudit('PROJECT_UPDATED', 'projects', id, updates);
    return { success: true };
  };

  const deleteProject = async (id: string) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
        await refreshData();
      }
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      // Dissociate work items
      setWorkItems((prev) => prev.map((w) => (w.project_id === id ? { ...w, project_id: null } : w)));
    }

    logAudit('PROJECT_DELETED', 'projects', id);
    return { success: true };
  };

  // Work Item Management Actions
  const createWorkItem = async (
    item: Omit<WorkItem, 'id' | 'created_at' | 'updated_at' | 'project_name' | 'assigned_employees'>,
    assigneeIds: string[]
  ) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only admins can create and assign work items.' };
    }

    const newItemId = 'work_' + Date.now();
    const newItem: WorkItem = {
      ...item,
      id: newItemId,
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: inserted, error: itemErr } = await supabase
          .from('work_items')
          .insert({
            project_id: item.project_id,
            title: item.title,
            description: item.description,
            priority: item.priority,
            status: item.status,
            start_date: item.start_date,
            deadline: item.deadline,
            estimated_hours: item.estimated_hours,
            overall_progress: item.overall_progress,
            created_by: profile.id,
          })
          .select()
          .single();

        if (itemErr || !inserted) return { success: false, error: itemErr?.message || 'Failed to insert work item.' };

        // Insert assignments
        if (assigneeIds.length > 0) {
          const assignmentsPayload = assigneeIds.map((empId) => ({
            work_item_id: inserted.id,
            employee_id: empId,
            assigned_by: profile.id,
            assignment_status: 'assigned',
          }));
          await supabase.from('work_assignments').insert(assignmentsPayload);
        }

        // Notify assigned employees
        for (const empId of assigneeIds) {
          await supabase.from('notifications').insert({
            recipient_id: empId,
            title: 'New Task Assignment',
            message: `You were assigned to: ${item.title}`,
          });
        }

        await refreshData();
      }
    } else {
      setWorkItems((prev) => [newItem, ...prev]);

      const newAssignments: WorkAssignment[] = assigneeIds.map((empId) => ({
        id: 'asgn_' + Date.now() + Math.random().toString(36).substring(2, 5),
        work_item_id: newItemId,
        employee_id: empId,
        assigned_by: profile.id,
        assigned_at: new Date().toISOString(),
        assignment_status: 'assigned',
      }));
      setWorkAssignments((prev) => [...prev, ...newAssignments]);

      // Add in-app notifications
      const notifs: Notification[] = assigneeIds.map((empId) => ({
        id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 5),
        recipient_id: empId,
        title: 'New Task Assignment',
        message: `${profile.full_name} assigned you to: ${item.title}`,
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      setNotifications((prev) => [...notifs, ...prev]);
    }

    logAudit('WORK_ITEM_CREATED', 'work_items', newItemId, { title: item.title, assignees: assigneeIds.length });
    return { success: true };
  };

  const updateWorkItem = async (id: string, updates: Partial<WorkItem>, assigneeIds?: string[]) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('work_items').update(updates).eq('id', id);
        if (error) return { success: false, error: error.message };

        if (assigneeIds !== undefined) {
          // Re-sync assignments
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
      }
    } else {
      setWorkItems((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w))
      );

      if (assigneeIds !== undefined) {
        setWorkAssignments((prev) => {
          const filtered = prev.filter((a) => a.work_item_id !== id);
          const added: WorkAssignment[] = assigneeIds.map((empId) => ({
            id: 'asgn_' + Date.now() + Math.random().toString(36).substring(2, 5),
            work_item_id: id,
            employee_id: empId,
            assigned_by: profile.id,
            assigned_at: new Date().toISOString(),
            assignment_status: 'assigned',
          }));
          return [...filtered, ...added];
        });
      }
    }

    logAudit('WORK_ITEM_UPDATED', 'work_items', id, updates);
    return { success: true };
  };

  const deleteWorkItem = async (id: string) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin privileges required.' };
    }

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('work_items').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
        await refreshData();
      }
    } else {
      setWorkItems((prev) => prev.filter((w) => w.id !== id));
      setWorkAssignments((prev) => prev.filter((a) => a.work_item_id !== id));
    }

    logAudit('WORK_ITEM_DELETED', 'work_items', id);
    return { success: true };
  };

  // Daily Work Report Operations
  const saveDailyReport = async (
    reportDate: string,
    entries: Omit<DailyWorkEntry, 'id' | 'daily_report_id' | 'created_at' | 'updated_at'>[],
    isDraft: boolean,
    existingReportId?: string
  ): Promise<{ success: boolean; error?: string; reportId?: string }> => {
    if (!profile) {
      return { success: false, error: 'You must be signed in to submit a daily report.' };
    }

    // Security & Validation: Check hours spent
    for (const entry of entries) {
      if (entry.hours_spent < 0 || entry.hours_spent > 24) {
        return { success: false, error: 'Hours spent must be between 0 and 24 hours.' };
      }
      if (entry.minutes_spent < 0 || entry.minutes_spent >= 60) {
        return { success: false, error: 'Minutes spent must be between 0 and 59.' };
      }
      if (entry.daily_progress_percentage < 0 || entry.daily_progress_percentage > 100) {
        return { success: false, error: 'Daily progress must be between 0% and 100%.' };
      }
    }

    const reportStatus: ReportStatus = isDraft ? 'draft' : 'submitted';

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (!supabase) return { success: false, error: 'Supabase client unavailable' };

      try {
        let repId = existingReportId;

        if (repId) {
          // Update existing
          const { error: repErr } = await supabase
            .from('daily_reports')
            .update({
              status: reportStatus,
              submitted_at: isDraft ? null : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', repId);

          if (repErr) return { success: false, error: repErr.message };

          // Delete existing entries to replace cleanly
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
              return { success: false, error: 'You have already submitted an approved report for this date.' };
            }
            repId = existing.id;
            await supabase
              .from('daily_reports')
              .update({
                status: reportStatus,
                submitted_at: isDraft ? null : new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', repId);
            await supabase.from('daily_work_entries').delete().eq('daily_report_id', repId);
          } else {
            // Insert new report
            const { data: inserted, error: insErr } = await supabase
              .from('daily_reports')
              .insert({
                employee_id: profile.id,
                report_date: reportDate,
                status: reportStatus,
                submitted_at: isDraft ? null : new Date().toISOString(),
              })
              .select()
              .single();

            if (insErr || !inserted) return { success: false, error: insErr?.message || 'Failed to create report.' };
            repId = inserted.id;
          }
        }

        // Insert daily work entries
        if (entries.length > 0 && repId) {
          const entryPayload = entries.map((e) => ({
            daily_report_id: repId,
            work_item_id: e.work_item_id,
            activity_description: e.activity_description,
            work_completed: e.work_completed,
            hours_spent: e.hours_spent,
            minutes_spent: e.minutes_spent,
            daily_progress_percentage: e.daily_progress_percentage,
            reported_overall_progress: e.reported_overall_progress,
            blockers: e.blockers || null,
            next_steps: e.next_steps || null,
            deliverable_url: e.deliverable_url || null,
          }));

          const { error: entriesErr } = await supabase.from('daily_work_entries').insert(entryPayload);
          if (entriesErr) return { success: false, error: entriesErr.message };

          // Record progress history for non-drafts
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
            }

            // Notify admin
            const admins = profiles.filter((p) => p.role === 'admin');
            for (const adm of admins) {
              await supabase.from('notifications').insert({
                recipient_id: adm.id,
                title: 'Daily Report Submitted',
                message: `${profile.full_name} submitted report for ${reportDate}.`,
              });
            }
          }
        }

        await refreshData();
        return { success: true, reportId: repId };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Database error while saving report.' };
      }
    } else {
      // Demo sandbox implementation
      let repId = existingReportId;

      if (!repId) {
        // Check duplicate
        const existing = dailyReports.find((r) => r.employee_id === profile.id && r.report_date === reportDate);
        if (existing) {
          if (existing.status === 'approved') {
            return { success: false, error: 'A report for this date has already been approved.' };
          }
          repId = existing.id;
        } else {
          repId = 'rep_' + Date.now();
          const newRep: DailyReport = {
            id: repId,
            employee_id: profile.id,
            report_date: reportDate,
            status: reportStatus,
            submitted_at: isDraft ? null : new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setDailyReports((prev) => [newRep, ...prev]);
        }
      }

      if (repId) {
        setDailyReports((prev) =>
          prev.map((r) =>
            r.id === repId
              ? {
                  ...r,
                  status: reportStatus,
                  submitted_at: isDraft ? null : new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : r
          )
        );

        // Replace entries
        const newEntries: DailyWorkEntry[] = entries.map((e) => ({
          ...e,
          id: 'entry_' + Date.now() + Math.random().toString(36).substring(2, 5),
          daily_report_id: repId!,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        setDailyWorkEntries((prev) => {
          const withoutOld = prev.filter((e) => e.daily_report_id !== repId);
          return [...withoutOld, ...newEntries];
        });

        // Non-draft updates: notify admin and update overall progress on tasks
        if (!isDraft) {
          const adminUsers = profiles.filter((p) => p.role === 'admin');
          const adminNotifs: Notification[] = adminUsers.map((a) => ({
            id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 5),
            recipient_id: a.id,
            title: 'Daily Report Submitted',
            message: `${profile.full_name} submitted work report for ${reportDate}.`,
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          setNotifications((prev) => [...adminNotifs, ...prev]);

          // Update task overall progress according to latest reported progress
          for (const e of entries) {
            if (e.reported_overall_progress > 0) {
              setWorkItems((prev) =>
                prev.map((w) =>
                  w.id === e.work_item_id
                    ? {
                        ...w,
                        overall_progress: e.reported_overall_progress,
                        status: e.reported_overall_progress >= 100 ? 'completed' : 'in_progress',
                        updated_at: new Date().toISOString(),
                      }
                    : w
                )
              );
            }
          }
        }
      }

      logAudit(
        isDraft ? 'REPORT_DRAFT_SAVED' : 'REPORT_SUBMITTED',
        'daily_reports',
        repId || 'unknown',
        { date: reportDate, entriesCount: entries.length }
      );

      return { success: true, reportId: repId };
    }
  };

  // Review Daily Report (Admin only)
  const reviewReport = async (
    reportId: string,
    status: 'approved' | 'revision_requested',
    comment?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can review reports.' };
    }

    const targetReport = dailyReports.find((r) => r.id === reportId);
    if (!targetReport) return { success: false, error: 'Report not found.' };

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase
          .from('daily_reports')
          .update({
            status,
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        if (error) return { success: false, error: error.message };

        if (comment) {
          await supabase.from('report_comments').insert({
            daily_report_id: reportId,
            author_id: profile.id,
            comment,
          });
        }

        // Notify employee
        await supabase.from('notifications').insert({
          recipient_id: targetReport.employee_id,
          title: status === 'approved' ? 'Daily Report Approved' : 'Revision Requested on Daily Report',
          message:
            status === 'approved'
              ? `${profile.full_name} approved your daily report for ${targetReport.report_date}.`
              : `${profile.full_name} requested revision on report for ${targetReport.report_date}: "${comment || 'Please update details'}"`,
        });

        await refreshData();
      }
    } else {
      setDailyReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status,
                reviewed_by: profile.id,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );

      // Add comment if present
      if (comment) {
        // Report comment stored in audit and notification
      }

      // Add notification for employee
      const notif: Notification = {
        id: 'notif_' + Date.now(),
        recipient_id: targetReport.employee_id,
        title: status === 'approved' ? 'Daily Report Approved' : 'Revision Requested on Report',
        message:
          status === 'approved'
            ? `${profile.full_name} approved your work report for ${targetReport.report_date}.`
            : `${profile.full_name} requested revisions on your report for ${targetReport.report_date}: "${comment || 'Check feedback'}"`,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    logAudit(status === 'approved' ? 'REPORT_APPROVED' : 'REVISION_REQUESTED', 'daily_reports', reportId, {
      report_date: targetReport.report_date,
      comment,
    });

    return { success: true };
  };

  const addReportComment = async (reportId: string, commentText: string) => {
    if (!profile) return { success: false, error: 'Must be logged in.' };

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('report_comments').insert({
          daily_report_id: reportId,
          author_id: profile.id,
          comment: commentText,
        });
        if (error) return { success: false, error: error.message };
        await refreshData();
      }
    }

    logAudit('COMMENT_ADDED', 'daily_reports', reportId, { comment: commentText });
    return { success: true };
  };

  // Notification Operations
  const markNotificationAsRead = async (id: string) => {
    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      }
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsAsRead = async () => {
    if (!profile) return;
    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', profile.id);
      }
    }
    setNotifications((prev) => prev.map((n) => (n.recipient_id === profile.id ? { ...n, is_read: true } : n)));
  };

  // Employee Provisioning
  const createEmployeeAccount = async (data: {
    full_name: string;
    email: string;
    department: string;
    job_title: string;
    role: 'admin' | 'employee';
  }) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only admins can provision accounts.' };
    }

    const newEmpId = 'ESI-' + (100 + profiles.length + 1);
    const newProfile: Profile = {
      id: 'usr_emp_' + Date.now(),
      employee_id: newEmpId,
      full_name: data.full_name,
      email: data.email,
      department: data.department,
      job_title: data.job_title,
      role: data.role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newProfile]);
    logAudit('EMPLOYEE_PROVISIONED', 'profiles', newProfile.id, { email: data.email, role: data.role });
    return { success: true };
  };

  const toggleProfileStatus = async (profileId: string, isActive: boolean) => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only admins can deactivate/reactivate users.' };
    }

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', profileId);
        if (error) return { success: false, error: error.message };
        await refreshData();
      }
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, is_active: isActive, updated_at: new Date().toISOString() } : p))
      );
    }

    logAudit('PROFILE_STATUS_CHANGED', 'profiles', profileId, { is_active: isActive });
    return { success: true };
  };

  const updateProfileRole = async (profileId: string, newRole: 'admin' | 'employee') => {
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can modify roles.' };
    }

    if (!isDemoMode && supabaseConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
        if (error) return { success: false, error: error.message };
        await refreshData();
      }
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole, updated_at: new Date().toISOString() } : p))
      );
    }

    logAudit('ROLE_UPDATED', 'profiles', profileId, { new_role: newRole });
    return { success: true };
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
    link.setAttribute('download', `esecurityin_daily_reports_${new Date().toISOString().split('T')[0]}.csv`);
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
