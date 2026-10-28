import React, { useState } from 'react';
import {
  ListTodo,
  Calendar,
  Clock,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ProgressBar } from '../common/ProgressBar';

interface MyAssignmentsViewProps {
  onOpenReportWithTask?: (taskId: string) => void;
}

export const MyAssignmentsView: React.FC<MyAssignmentsViewProps> = ({ onOpenReportWithTask }) => {
  const { profile } = useAuth();
  const { workItems, workAssignments } = useData();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const myAssignedIds = workAssignments
    .filter((a) => a.employee_id === profile?.id)
    .map((a) => a.work_item_id);

  const myTasks = workItems.filter((w) => myAssignedIds.includes(w.id));

  const filteredTasks = myTasks.filter((t) => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ListTodo size={22} className="text-cyan-400" />
          My Assigned Security Tasks ({myTasks.length})
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Work items, subtasks, and deliverables assigned to you by administrators.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search my tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-2 p-10 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            No assigned tasks match your filter criteria.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      {task.project_name}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug">{task.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px]">
                    Est: <strong className="text-slate-200">{task.estimated_hours}h</strong>
                  </span>
                  <span className="font-semibold text-slate-200 font-mono">
                    Task Overall Progress: {task.overall_progress}%
                  </span>
                </div>
                <ProgressBar progress={task.overall_progress} size="sm" />

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="font-mono flex items-center gap-1">
                    <Calendar size={13} className="text-slate-500" />
                    Deadline: {task.deadline || 'Ongoing'}
                  </span>

                  {onOpenReportWithTask && (
                    <button
                      onClick={() => onOpenReportWithTask(task.id)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Log Daily Hours &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
