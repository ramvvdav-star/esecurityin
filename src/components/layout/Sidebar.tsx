import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileCheck2,
  Users,
  BarChart3,
  ScrollText,
  Database,
  FileSpreadsheet,
  CalendarCheck,
  ListTodo,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export type NavView =
  | 'dashboard'
  | 'projects'
  | 'work_items'
  | 'review_reports'
  | 'employees'
  | 'analytics'
  | 'audit_logs'
  | 'my_report'
  | 'my_tasks'
  | 'report_history'
  | 'supabase_setup';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { profile } = useAuth();
  const { dailyReports, workAssignments, workItems } = useData();

  const isAdmin = profile?.role === 'admin';

  // Count pending reviews for admin
  const pendingReportsCount = dailyReports.filter((r) => r.status === 'submitted').length;

  // Count active assigned tasks for employee
  const myAssignedIds = workAssignments.filter((a) => a.employee_id === profile?.id).map((a) => a.work_item_id);
  const myActiveTasksCount = workItems.filter((w) => myAssignedIds.includes(w.id) && w.status !== 'completed').length;

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Administrative Operations' : 'Employee Workspace'}
          </div>

          <nav className="space-y-1 text-sm">
            {isAdmin ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={18} />
                    <span>Admin Dashboard</span>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('projects')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'projects'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderKanban size={18} />
                    <span>Projects &amp; Scope</span>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('work_items')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'work_items'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare size={18} />
                    <span>Work Items &amp; Subtasks</span>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('review_reports')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'review_reports'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck2 size={18} />
                    <span>Daily Reports Review</span>
                  </div>
                  {pendingReportsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {pendingReportsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('employees')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'employees'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users size={18} />
                    <span>Employee Directory</span>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('analytics')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'analytics'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 size={18} />
                    <span>Analytics &amp; CSV Export</span>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('audit_logs')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'audit_logs'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ScrollText size={18} />
                    <span>Security Audit Logs</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={18} />
                    <span>My Dashboard</span>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('my_report')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'my_report'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarCheck size={18} className="text-cyan-400" />
                    <span className="font-medium">My Daily Work Report</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold">
                    Daily
                  </span>
                </button>

                <button
                  onClick={() => onNavigate('my_tasks')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'my_tasks'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ListTodo size={18} />
                    <span>My Assigned Tasks</span>
                  </div>
                  {myActiveTasksCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                      {myActiveTasksCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('report_history')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'report_history'
                      ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <History size={18} />
                    <span>Report History &amp; Feedback</span>
                  </div>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Database & RLS Settings */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            System &amp; Database
          </div>
          <button
            onClick={() => onNavigate('supabase_setup')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'supabase_setup'
                ? 'bg-cyan-600/15 text-cyan-400 font-semibold border border-cyan-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database size={18} className="text-cyan-400" />
              <span>Supabase &amp; RLS Policies</span>
            </div>
          </button>
        </div>
      </div>

      {/* User Status Footer in Sidebar */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Role:</span>
            <span
              className={`font-semibold capitalize px-2 py-0.5 rounded-md ${
                isAdmin
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {profile?.role}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            {profile?.job_title}
          </div>
        </div>
      </div>
    </aside>
  );
};
