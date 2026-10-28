import React from 'react';
import {
  CalendarCheck,
  CheckSquare,
  Clock,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ProgressBar } from '../common/ProgressBar';

interface EmployeeDashboardProps {
  onNavigate: (view: any) => void;
  onOpenReportForDate?: (date: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigate, onOpenReportForDate }) => {
  const { profile } = useAuth();
  const { workItems, workAssignments, dailyReports, notifications } = useData();

  const todayStr = new Date().toISOString().split('T')[0];

  // Assigned items
  const myAssignedIds = workAssignments
    .filter((a) => a.employee_id === profile?.id)
    .map((a) => a.work_item_id);

  const myWorkItems = workItems.filter((w) => myAssignedIds.includes(w.id));
  const activeTasks = myWorkItems.filter((w) => w.status !== 'completed');

  // Today's report
  const todayReport = dailyReports.find(
    (r) => r.employee_id === profile?.id && r.report_date === todayStr
  );

  // Revision requested report (if any)
  const revisionReport = dailyReports.find(
    (r) => r.employee_id === profile?.id && r.status === 'revision_requested'
  );

  // Calculate my logged hours this week
  const myReports = dailyReports.filter((r) => r.employee_id === profile?.id);
  const myHoursThisWeek = myReports.reduce((sum, r) => sum + (r.total_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            eSecurityIn Staff Portal • {profile?.employee_id}
          </div>
          <h1 className="text-2xl font-bold text-white">Hello, {profile?.full_name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {profile?.job_title} • {profile?.department}
          </p>
        </div>

        <button
          onClick={() => onNavigate('my_report')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all self-start md:self-auto cursor-pointer"
        >
          <CalendarCheck size={16} />
          <span>Open Today's Work Report</span>
        </button>
      </div>

      {/* Revision Requested Alert (if applicable) */}
      {revisionReport && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <strong className="text-amber-300 block font-semibold text-sm">
                Revision Requested on Report ({revisionReport.report_date})
              </strong>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Your administrator reviewed your daily report and requested changes before approval. Please update your work descriptions or deliverables.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onOpenReportForDate) onOpenReportForDate(revisionReport.report_date);
              onNavigate('my_report');
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex-shrink-0 cursor-pointer"
          >
            Review &amp; Edit
          </button>
        </div>
      )}

      {/* Today's Report Status Card & My Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Filing Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Today's Status</span>
              <span className="font-mono">{todayStr}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {todayReport ? (
                <>
                  <StatusBadge status={todayReport.status} />
                  <span className="text-xs text-slate-300 font-mono">
                    {todayReport.total_hours} hrs logged
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400 animate-pulse" />
                  Not Filed Yet
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {todayReport?.status === 'approved'
                ? 'Your daily work report for today has been reviewed and approved by management.'
                : todayReport?.status === 'submitted'
                ? 'Your report is currently in the review queue awaiting manager approval.'
                : 'Please document tasks completed, hours spent, and deliverables before end-of-day.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('my_report')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{todayReport ? 'View / Update Report' : 'Draft Daily Report Now'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Active Tasks Assigned */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Assigned Work Items
              </span>
              <CheckSquare size={16} className="text-cyan-400" />
            </div>

            <div className="mt-2">
              <div className="text-3xl font-extrabold text-white">{activeTasks.length}</div>
              <div className="text-xs text-slate-400 mt-1">Active tasks currently assigned to you</div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('my_tasks')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Inspect My Tasks</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Weekly Hours Logged */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                My Weekly Logged Time
              </span>
              <Clock size={16} className="text-emerald-400" />
            </div>

            <div className="mt-2">
              <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                {Math.round(myHoursThisWeek * 10) / 10}h
              </div>
              <div className="text-xs text-slate-400 mt-1">Recorded across submitted work entries</div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('report_history')}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Full Report History</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Active Tasks List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare size={18} className="text-cyan-400" />
              My Current Security Tasks ({activeTasks.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasks assigned to you by administrators that you can report against today.
            </p>
          </div>

          <button
            onClick={() => onNavigate('my_tasks')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            View Details &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic col-span-2 py-4 text-center">
              No active tasks assigned to you right now.
            </p>
          ) : (
            activeTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 block">
                      {task.project_name}
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm mt-0.5">{task.title}</h4>
                  </div>
                  <PriorityBadge priority={task.priority} size="sm" />
                </div>

                {task.description && (
                  <p className="text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
                )}

                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Task Progress</span>
                    <span className="font-semibold text-slate-200">{task.overall_progress}%</span>
                  </div>
                  <ProgressBar progress={task.overall_progress} size="sm" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Est: {task.estimated_hours}h</span>
                  <span>Due: {task.deadline || 'No deadline'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
