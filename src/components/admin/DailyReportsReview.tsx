import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Clock,
  Calendar,
  ExternalLink,
  AlertTriangle,
  User,
  Filter,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DailyReport, ReportStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ProgressBar } from '../common/ProgressBar';
import { formatDisplayDate } from '../../lib/dateUtils';

export const DailyReportsReview: React.FC = () => {
  const { profile } = useAuth();
  const { dailyReports, profiles, reviewReport, addReportComment, exportReportsCSV } = useData();

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('submitted');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Expand state for report cards
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Review action modal state
  const [reviewAction, setReviewAction] = useState<{
    reportId: string;
    type: 'approved' | 'revision_requested';
  } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const departments = Array.from(new Set(profiles.map((p) => p.department)));

  const filteredReports = dailyReports.filter((report) => {
    if (selectedStatus !== 'all' && report.status !== selectedStatus) return false;
    if (selectedEmployee !== 'all' && report.employee_id !== selectedEmployee) return false;
    if (selectedDepartment !== 'all' && report.employee?.department !== selectedDepartment) return false;
    if (dateFilter && report.report_date !== dateFilter) return false;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  const handleOpenReview = (reportId: string, type: 'approved' | 'revision_requested') => {
    setReviewAction({ reportId, type });
    setFeedbackComment('');
  };

  const handleConfirmReview = async () => {
    if (!reviewAction) return;
    setIsSubmittingReview(true);

    try {
      await reviewReport(reviewAction.reportId, reviewAction.type, feedbackComment);
      setReviewAction(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 size={22} className="text-cyan-400" />
            Daily Work Reports Review Panel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit daily activities, verify logged time, review deliverables, and approve or request revisions.
          </p>
        </div>

        <button
          onClick={exportReportsCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all self-start sm:self-auto cursor-pointer"
        >
          <Download size={14} />
          <span>Export All Reports (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Status Tab Pills */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setSelectedStatus('submitted')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                selectedStatus === 'submitted'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Review ({dailyReports.filter((r) => r.status === 'submitted').length})
            </button>
            <button
              onClick={() => setSelectedStatus('approved')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                selectedStatus === 'approved'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Approved ({dailyReports.filter((r) => r.status === 'approved').length})
            </button>
            <button
              onClick={() => setSelectedStatus('revision_requested')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                selectedStatus === 'revision_requested'
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Revisions ({dailyReports.filter((r) => r.status === 'revision_requested').length})
            </button>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                selectedStatus === 'all'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Submissions
            </button>
          </div>

          {/* Employee dropdown */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Employees</option>
            {profiles
              .filter((p) => p.role === 'employee')
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.employee_id})
                </option>
              ))}
          </select>

          {/* Department dropdown */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300">
            <Calendar size={13} className="text-slate-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2">
            <CheckCircle2 size={28} className="mx-auto text-slate-600" />
            <p>No reports match the selected review criteria.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedReportId === report.id || report.status === 'submitted';

            return (
              <div
                key={report.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all shadow-sm space-y-4 ${
                  report.status === 'submitted'
                    ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {report.employee?.avatar_url ? (
                      <img
                        src={report.employee.avatar_url}
                        alt={report.employee.full_name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-800"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                        {report.employee?.full_name ? report.employee.full_name.charAt(0) : 'E'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">
                          {report.employee?.full_name}
                        </span>
                        <span className="font-mono text-xs text-cyan-400 font-semibold">
                          {report.employee?.employee_id}
                        </span>
                        <StatusBadge status={report.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {report.employee?.department} • {report.employee?.job_title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-slate-300 font-mono font-medium">
                        <Calendar size={13} className="text-cyan-400" />
                        Report Date: <strong>{formatDisplayDate(report.report_date)}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Hours Logged: <strong className="text-cyan-400">{report.total_hours} hrs</strong> (
                        {report.entries?.length || 0} entries)
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(report.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Work Entries */}
                {isExpanded && (
                  <div className="space-y-4 pt-3 border-t border-slate-800/80">
                    <div className="space-y-3">
                      {report.entries?.map((entry, idx) => (
                        <div
                          key={entry.id || idx}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                                {entry.work_item?.project_name || 'Standalone Task'}
                              </span>
                              <h4 className="text-sm font-bold text-white">
                                {entry.work_item?.title || 'Security Work Item'}
                              </h4>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                Time: {entry.hours_spent}h {entry.minutes_spent}m
                              </span>
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                Overall Progress: {entry.reported_overall_progress}%
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <strong className="text-slate-300 block mb-1">Activity Description:</strong>
                              <p className="text-slate-400 leading-relaxed">{entry.activity_description}</p>
                            </div>

                            <div>
                              <strong className="text-slate-300 block mb-1">Work Accomplished:</strong>
                              <p className="text-slate-400 leading-relaxed">{entry.work_completed}</p>
                            </div>
                          </div>

                          {/* Blockers and next steps */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/50">
                            {entry.blockers && (
                              <div>
                                <span className="text-amber-400 font-semibold flex items-center gap-1 mb-0.5">
                                  <AlertTriangle size={12} />
                                  Blockers / Roadblocks:
                                </span>
                                <p className="text-slate-400">{entry.blockers}</p>
                              </div>
                            )}

                            {entry.next_steps && (
                              <div>
                                <span className="text-slate-300 font-semibold block mb-0.5">
                                  Next Planned Steps:
                                </span>
                                <p className="text-slate-400">{entry.next_steps}</p>
                              </div>
                            )}
                          </div>

                          {/* Deliverable Link */}
                          {entry.deliverable_url && (
                            <div className="pt-2 border-t border-slate-800/50 flex items-center gap-2">
                              <span className="text-slate-400 font-semibold">Deliverable Link:</span>
                              <a
                                href={entry.deliverable_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 font-mono text-[11px]"
                              >
                                <span>{entry.deliverable_url}</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Review Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 bg-slate-950/40 p-3 rounded-xl">
                      <div className="text-xs text-slate-400">
                        {report.reviewed_by ? (
                          <span>
                            Reviewed by{' '}
                            <strong className="text-slate-200">
                              {report.reviewer?.full_name || 'Administrator'}
                            </strong>{' '}
                            on {report.reviewed_at ? new Date(report.reviewed_at).toLocaleDateString() : ''}
                          </span>
                        ) : (
                          <span>Report submitted on {new Date(report.submitted_at || '').toLocaleTimeString()}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleOpenReview(report.id, 'revision_requested')}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>Request Revision</span>
                        </button>
                        <button
                          onClick={() => handleOpenReview(report.id, 'approved')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve Report</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Confirmation Modal with Optional Feedback Comment */}
      {reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200">
            <h3 className="text-lg font-bold text-white mb-2">
              {reviewAction.type === 'approved' ? 'Approve Daily Report' : 'Request Report Revision'}
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {reviewAction.type === 'approved'
                ? 'Approve and stamp this work report. The employee will be notified that their logged hours and deliverables are accepted.'
                : 'Send this report back to the employee for corrections. Please provide clear feedback explaining what details need revision.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {reviewAction.type === 'approved'
                    ? 'Reviewer Note (Optional)'
                    : 'Revision Feedback / Comment (Required)'}
                </label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder={
                    reviewAction.type === 'approved'
                      ? 'Great work on discovering the OAuth race condition!'
                      : 'Please clarify testing methodology on transaction receipt endpoint and attach Burp curl command.'
                  }
                  required={reviewAction.type === 'revision_requested'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewAction(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReview || (reviewAction.type === 'revision_requested' && !feedbackComment.trim())}
                  onClick={handleConfirmReview}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors text-white ${
                    reviewAction.type === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {isSubmittingReview
                    ? 'Processing...'
                    : reviewAction.type === 'approved'
                    ? 'Confirm Approval'
                    : 'Send Revision Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
