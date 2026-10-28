import React from 'react';
import { ItemPriority } from '../../types';
import { ShieldAlert, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ItemPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const getStyles = () => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (priority) {
      case 'critical':
        return <ShieldAlert size={iconSize} className="mr-1 text-red-400" />;
      case 'high':
        return <AlertTriangle size={iconSize} className="mr-1 text-orange-400" />;
      case 'medium':
        return <ArrowUpRight size={iconSize} className="mr-1 text-amber-400" />;
      case 'low':
        return <ArrowDownRight size={iconSize} className="mr-1 text-emerald-400" />;
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeClass} ${getStyles()}`}
    >
      {getIcon()}
      {priority.toUpperCase()}
    </span>
  );
};
