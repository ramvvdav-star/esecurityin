import React, { useState } from 'react';
import {
  History,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatDisplayDate } from '../../lib/dateUtils';

interface ReportHistoryViewProps {
  onEditReport: (date: string) => void;
}

export const ReportHistoryView: React.FC<ReportHistoryViewProps> = ({ onEditReport }) => {
  const { profile } = useAuth();
  const { dailyReports } = useData();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const myReports = dailyReports
    .filter((r) => r.employee_id === profile?.id)
    .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());

  const filteredReports = myReports.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History size={22} className="text-cyan-400" />
            Report History &amp; Management Feedback
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect previous work reports, verify approved logged hours, and review admin feedback.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 self-start sm:self-auto"
        >
          <option value="all">All Statuses ({myReports.length})</option>
          <option value="approved">Approved</option>
          <option value="submitted">Submitted</option>
          <option value="revision_requested">Revision Requested</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-2">
            <Calendar size={28} className="mx-auto text-slate-600" />
            <p>No historical reports found.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const canEdit = report.status === 'draft' || report.status === 'revision_requested';

            return (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                      <Calendar size={18} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-base text-white">
                          {formatDisplayDate(report.report_date)}
                        </span>
                        <span className="text-xs font-mono text-slate-400">({report.report_date})</span>
                        <StatusBadge status={report.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        Hours Logged: <strong className="text-cyan-400">{report.total_hours} hrs</strong> •{' '}
                        {report.entries?.length || 0} tasks reported
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {canEdit && (
                      <button
                        onClick={() => onEditReport(report.report_date)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Edit2 size={13} />
                        <span>Edit / Revise</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(report.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    <div className="space-y-3">
                      {report.entries?.map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="font-bold text-slate-200">
                              {entry.work_item?.title || 'Security Work Item'}
                            </span>
                            <span className="font-mono text-cyan-400 font-semibold">
                              {entry.hours_spent}h {entry.minutes_spent}m
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block mb-0.5 font-semibold">
                              Work Accomplished:
                            </span>
                            <p className="text-slate-300 leading-relaxed">{entry.work_completed}</p>
                          </div>

                          {entry.deliverable_url && (
                            <div className="pt-1 flex items-center gap-2">
                              <span className="text-slate-500">Deliverable:</span>
                              <a
                                href={entry.deliverable_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 underline inline-flex items-center gap-1 font-mono text-[11px]"
                              >
                                <span>{entry.deliverable_url}</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Review Stamp */}
                    {report.reviewed_by && (
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                          <CheckCircle2 size={16} />
                          <span>Reviewed &amp; Approved</span>
                        </div>
                        <span>
                          Reviewed by {report.reviewer?.full_name || 'Admin'} on{' '}
                          {new Date(report.reviewed_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
