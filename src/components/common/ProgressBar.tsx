import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'emerald' | 'cyan' | 'amber';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  size = 'md',
  color = 'default',
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)));

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-1.5';
      case 'lg':
        return 'h-3';
      case 'md':
      default:
        return 'h-2';
    }
  };

  const getBarColor = () => {
    if (color === 'emerald' || clamped === 100) {
      return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    }
    if (color === 'amber') {
      return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    }
    if (color === 'cyan') {
      return 'bg-gradient-to-r from-cyan-500 to-blue-500';
    }
    if (clamped < 30) {
      return 'bg-gradient-to-r from-slate-500 to-cyan-500';
    }
    if (clamped < 70) {
      return 'bg-gradient-to-r from-cyan-500 to-indigo-500';
    }
    return 'bg-gradient-to-r from-teal-500 to-emerald-400';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        <div className={`w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 ${getHeight()}`}>
          <div
            className={`h-full transition-all duration-500 ease-out rounded-full ${getBarColor()}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-xs font-semibold tabular-nums text-slate-300 min-w-9 text-right">
            {clamped}%
          </span>
        )}
      </div>
    </div>
  );
};
