import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileCheck2,
  Users,
  BarChart3,
  ScrollText,
  CalendarCheck,
  ListTodo,
  History,
  X,
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
  | 'report_history';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { profile } = useAuth();
  const { dailyReports, workAssignments, workItems } = useData();

  const isAdmin = profile?.role === 'admin';

  // Count pending reviews for admin
  const pendingReportsCount = dailyReports.filter((r) => r.status === 'submitted').length;

  // Count active assigned tasks for employee
  const myAssignedIds = workAssignments.filter((a) => a.employee_id === profile?.id).map((a) => a.work_item_id);
  const myActiveTasksCount = workItems.filter((w) => myAssignedIds.includes(w.id) && w.status !== 'completed').length;

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 h-full">
      <div className="space-y-6 overflow-y-auto">
        {/* Mobile close button header */}
        <div className="flex md:hidden items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Navigation Menu</span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isAdmin ? 'Administrative Operations' : 'Employee Workspace'}
          </div>

          <nav className="space-y-1 text-sm">
            {isAdmin ? (
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
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
                  onClick={() => handleNavClick('projects')}
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
                  onClick={() => handleNavClick('work_items')}
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
                  onClick={() => handleNavClick('review_reports')}
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
                  onClick={() => handleNavClick('employees')}
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
                  onClick={() => handleNavClick('analytics')}
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
                  onClick={() => handleNavClick('audit_logs')}
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
                  onClick={() => handleNavClick('dashboard')}
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
                  onClick={() => handleNavClick('my_report')}
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
                  onClick={() => handleNavClick('my_tasks')}
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
                  onClick={() => handleNavClick('report_history')}
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

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden md:block h-full">
        {navContent}
      </div>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-50 h-full">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
