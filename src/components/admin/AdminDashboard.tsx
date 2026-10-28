import React, { useState } from 'react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  FileCheck2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Download,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ProgressBar } from '../common/ProgressBar';
import { getTodayDateString } from '../../lib/dateUtils';

interface AdminDashboardProps {
  onNavigate: (view: any) => void;
  onOpenCreateProject: () => void;
  onOpenCreateWorkItem: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenCreateProject,
  onOpenCreateWorkItem,
}) => {
  const { profile } = useAuth();
  const { stats, projects, workItems, dailyReports, profiles, exportReportsCSV } = useData();

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const departments = Array.from(new Set(profiles.map((p) => p.department)));

  // Identify employees missing today's report
  const todayStr = getTodayDateString();
  const activeEmployees = profiles.filter((p) => p.role === 'employee' && p.is_active);
  const submittedEmployeeIds = dailyReports
    .filter((r) => r.report_date === todayStr && (r.status === 'submitted' || r.status === 'approved'))
    .map((r) => r.employee_id);
  const missingEmployees = activeEmployees.filter((e) => !submittedEmployeeIds.includes(e.id));

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            eSecurityIn Operations Center
          </div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile?.full_name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time daily work logs, project delivery milestones, and multi-employee workload distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={onOpenCreateProject}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>New Project</span>
          </button>
          <button
            onClick={onOpenCreateWorkItem}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-cyan-900/30 cursor-pointer"
          >
            <CheckSquare size={15} />
            <span>Create &amp; Assign Task</span>
          </button>
          <button
            onClick={exportReportsCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-medium transition-colors"
            title="Export all reports to CSV"
          >
            <Download size={14} />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Active Employees */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Staff</span>
            <Users size={16} className="text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-white">{stats.totalActiveEmployees}</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <span>Security Staff</span>
            </div>
          </div>
        </div>

        {/* Total Projects */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Projects</span>
            <FolderKanban size={16} className="text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-white">{stats.totalProjects}</div>
            <div className="text-[11px] text-slate-400 mt-1">Client Engagements</div>
          </div>
        </div>

        {/* Work Items */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Work Items</span>
            <CheckSquare size={16} className="text-indigo-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-white">{stats.totalWorkItems}</div>
            <div className="text-[11px] text-cyan-400 mt-1">{stats.inProgressTasks} In Progress</div>
          </div>
        </div>

        {/* Reports Filed Today */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Submitted Today</span>
            <FileCheck2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-white">{stats.reportsSubmittedToday}</div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {stats.totalActiveEmployees > 0
                ? `${Math.round((stats.reportsSubmittedToday / stats.totalActiveEmployees) * 100)}% compliance`
                : '0%'}
            </div>
          </div>
        </div>

        {/* Missing Reports Today */}
        <div
          onClick={() => onNavigate('review_reports')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-500/40 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Missing Reports</span>
            <AlertCircle size={16} className="text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-amber-400">{stats.missingReportsToday}</div>
            <div className="text-[11px] text-slate-400 mt-1">Needs submission today</div>
          </div>
        </div>

        {/* Overdue Work Items */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Overdue Items</span>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-rose-400">{stats.overdueTasks}</div>
            <div className="text-[11px] text-slate-400 mt-1">Passed task deadline</div>
          </div>
        </div>
      </div>

      {/* Missing Reports Alert & Employee Workload Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Missing Reports Alert Box */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Daily Report Compliance (Today)
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {todayStr}
            </span>
          </div>

          {missingEmployees.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-300 space-y-1">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
              <div className="font-semibold text-emerald-200">100% Submissions Received!</div>
              <p className="text-slate-400">All active employees have submitted reports for today.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                The following security team members have not submitted their daily report yet:
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {missingEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{emp.full_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {emp.employee_id} • {emp.department}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => onNavigate('review_reports')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Inspect All Submissions in Review Queue</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Employee Workload Distribution Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" />
                Employee Workload &amp; Weekly Activity
              </h3>
              <p className="text-xs text-slate-400">
                Individual task assignments, logged hours, and task completion velocity.
              </p>
            </div>
            <button
              onClick={() => onNavigate('employees')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Manage Team &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Employee</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Tasks</th>
                  <th className="py-2.5 px-3 font-semibold">Hours Reported</th>
                  <th className="py-2.5 px-3 font-semibold">Task Velocity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.employeeWorkloads.map((item) => (
                  <tr key={item.employeeId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{item.employeeName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.employeeId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-300">{item.assignedTasksCount}</span>
                      <span className="text-slate-500 ml-1">tasks</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-cyan-400 font-mono">{item.hoursReportedThisWeek}h</span>
                    </td>
                    <td className="py-3 px-3 w-40">
                      <ProgressBar progress={item.completionRate} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Projects with Multi-Employee Subtasks Showcase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FolderKanban size={18} className="text-cyan-400" />
              Active Projects &amp; Subtask Allocations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-employee assignments with distinct individual contributions.
            </p>
          </div>

          {/* Quick status filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const projectWorkItems = workItems.filter((w) => w.project_id === project.id);
            const totalProjectHours = projectWorkItems.reduce((acc, curr) => acc + curr.estimated_hours, 0);
            const avgProgress =
              projectWorkItems.length > 0
                ? Math.round(
                    projectWorkItems.reduce((acc, curr) => acc + curr.overall_progress, 0) /
                      projectWorkItems.length
                  )
                : 0;

            return (
              <div
                key={project.id}
                className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-base font-bold text-white">{project.name}</h4>
                      <StatusBadge status={project.status} size="sm" />
                    </div>
                    {project.description && (
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">{project.description}</p>
                    )}
                  </div>

                  <div className="text-right sm:min-w-44">
                    <div className="text-xs text-slate-400 mb-1">
                      Project Completion: <strong className="text-white">{avgProgress}%</strong>
                    </div>
                    <ProgressBar progress={avgProgress} />
                  </div>
                </div>

                {/* Subtasks breakdown */}
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                    Subtask Ownership ({projectWorkItems.length} items):
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {projectWorkItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-200 line-clamp-1">{item.title}</span>
                          <PriorityBadge priority={item.priority} size="sm" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Subtask Progress</span>
                            <span className="font-semibold text-slate-300">{item.overall_progress}%</span>
                          </div>
                          <ProgressBar progress={item.overall_progress} size="sm" />
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                          <span className="text-slate-400">
                            Assignees ({item.assigned_employees?.length || 0}):
                          </span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {item.assigned_employees?.map((emp) => (
                              <img
                                key={emp.id}
                                src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80'}
                                alt={emp.full_name}
                                title={`${emp.full_name} (${emp.employee_id})`}
                                className="inline-block h-5 w-5 rounded-full ring-1 ring-slate-900 object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
