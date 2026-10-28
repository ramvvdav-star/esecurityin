import React from 'react';
import { ProjectStatus, ItemStatus, ReportStatus, AssignmentStatus } from '../../types';

interface StatusBadgeProps {
  status: ProjectStatus | ItemStatus | ReportStatus | AssignmentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      // Report statuses
      case 'approved':
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'submitted':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'revision_requested':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'draft':
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';

      // Project & Work Item statuses
      case 'active':
      case 'in_progress':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'planning':
      case 'assigned':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'on_hold':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      case 'overdue':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'archived':
      case 'reassigned':
        return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
      case 'pending':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';

      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'revision_requested':
        return 'Revision Requested';
      case 'on_hold':
        return 'On Hold';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : '';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClass} ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {getLabel()}
    </span>
  );
};
