import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Layers,
  PieChart,
  Users,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ProgressBar } from '../common/ProgressBar';

export const AnalyticsPanel: React.FC = () => {
  const { profiles, projects, workItems, dailyReports, dailyWorkEntries, stats, exportReportsCSV } = useData();

  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  // Compute total hours across all approved and submitted reports
  const totalLoggedHours = dailyReports.reduce((sum, r) => sum + (r.total_hours || 0), 0);
  const totalApprovedHours = dailyReports
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + (r.total_hours || 0), 0);

  // Group hours by department
  const deptHours: Record<string, number> = {};
  dailyReports.forEach((rep) => {
    const dept = rep.employee?.department || 'Unassigned';
    deptHours[dept] = (deptHours[dept] || 0) + (rep.total_hours || 0);
  });

  const deptList = Object.entries(deptHours).map(([name, hours]) => ({
    name,
    hours: Math.round(hours * 10) / 10,
    percentage: totalLoggedHours > 0 ? Math.round((hours / totalLoggedHours) * 100) : 0,
  }));

  // Employee ranked by hours
  const employeeRankings = stats.employeeWorkloads
    .slice()
    .sort((a, b) => b.hoursReportedThisWeek - a.hoursReportedThisWeek);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={22} className="text-cyan-400" />
            Time Analytics &amp; Compliance Reporting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit aggregate team hours, analyze department workload split, and download payroll CSV summaries.
          </p>
        </div>

        <button
          onClick={exportReportsCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download size={15} />
          <span>Download Reports CSV</span>
        </button>
      </div>

      {/* Aggregate metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Logged Hours</span>
            <Clock size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {Math.round(totalLoggedHours * 10) / 10}h
          </div>
          <p className="text-[11px] text-slate-500">Across all submitted work reports</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Approved Hours</span>
            <Award size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {Math.round(totalApprovedHours * 10) / 10}h
          </div>
          <p className="text-[11px] text-slate-500">Verified by administrative review</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Task Velocity</span>
            <TrendingUp size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats.completedTasks} / {stats.totalWorkItems}
          </div>
          <p className="text-[11px] text-slate-500">Completed security work items</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Daily Filing Rate</span>
            <Calendar size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats.totalActiveEmployees > 0
              ? `${Math.round((stats.reportsSubmittedToday / stats.totalActiveEmployees) * 100)}%`
              : '0%'}
          </div>
          <p className="text-[11px] text-slate-500">Employees submitted on time today</p>
        </div>
      </div>

      {/* Department Breakdown & Individual Employee Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Allocation */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                Department Hours Distribution
              </h3>
              <p className="text-xs text-slate-400">Total hours logged per functional cybersecurity team.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {deptList.map((d) => (
              <div key={d.name} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-semibold">{d.name}</span>
                  <span className="font-mono text-cyan-400 font-bold">{d.hours}h ({d.percentage}%)</span>
                </div>
                <ProgressBar progress={d.percentage} size="sm" color="cyan" />
              </div>
            ))}
          </div>
        </div>

        {/* Employee Workload Leaderboard */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                Individual Staff Hours &amp; Completion Rate
              </h3>
              <p className="text-xs text-slate-400">Hours reported per active employee this cycle.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {employeeRankings.map((emp, index) => (
              <div key={emp.employeeId} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono font-bold text-[10px]">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-200">{emp.employeeName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {emp.employeeId} • {emp.assignedTasksCount} tasks assigned
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-cyan-400 text-sm">
                    {emp.hoursReportedThisWeek} hrs
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    {emp.completionRate}% completion
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
