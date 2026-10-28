import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Trash2,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Link,
  MessageSquare,
  HelpCircle,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { DailyWorkEntry, DailyReport } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { getTodayDateString, formatDisplayDate } from '../../lib/dateUtils';

interface DailyReportFormProps {
  initialDate?: string;
  onNavigateHistory?: () => void;
}

interface EntryFormState {
  id?: string;
  work_item_id: string;
  activity_description: string;
  work_completed: string;
  hours_spent: number;
  minutes_spent: number;
  daily_progress_percentage: number;
  reported_overall_progress: number;
  blockers: string;
  next_steps: string;
  deliverable_url: string;
}

export const DailyReportForm: React.FC<DailyReportFormProps> = ({ initialDate, onNavigateHistory }) => {
  const { profile } = useAuth();
  const { workItems, workAssignments, dailyReports, saveDailyReport } = useData();

  const [reportDate, setReportDate] = useState<string>(
    initialDate || getTodayDateString()
  );

  // Available tasks assigned to this employee
  const myAssignedWorkItemIds = workAssignments
    .filter((a) => a.employee_id === profile?.id)
    .map((a) => a.work_item_id);

  const myAvailableTasks = workItems.filter(
    (w) => myAssignedWorkItemIds.includes(w.id) || w.project_id === null
  );

  // Existing report for this date
  const existingReport = dailyReports.find(
    (r) => r.employee_id === profile?.id && r.report_date === reportDate
  );

  // Entries form state
  const [entries, setEntries] = useState<EntryFormState[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load existing report entries if available
  useEffect(() => {
    if (existingReport && existingReport.entries && existingReport.entries.length > 0) {
      setEntries(
        existingReport.entries.map((e) => ({
          id: e.id,
          work_item_id: e.work_item_id,
          activity_description: e.activity_description,
          work_completed: e.work_completed,
          hours_spent: Number(e.hours_spent) || 0,
          minutes_spent: Number(e.minutes_spent) || 0,
          daily_progress_percentage: Number(e.daily_progress_percentage) || 0,
          reported_overall_progress: Number(e.reported_overall_progress) || 0,
          blockers: e.blockers || '',
          next_steps: e.next_steps || '',
          deliverable_url: e.deliverable_url || '',
        }))
      );
    } else {
      // Default to 1 empty entry preselected with first assigned task
      const defaultTaskId = myAvailableTasks[0]?.id || '';
      setEntries([
        {
          work_item_id: defaultTaskId,
          activity_description: '',
          work_completed: '',
          hours_spent: 4,
          minutes_spent: 0,
          daily_progress_percentage: 20,
          reported_overall_progress: 50,
          blockers: '',
          next_steps: '',
          deliverable_url: '',
        },
      ]);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [existingReport, reportDate]);

  const addEntryRow = () => {
    const defaultTaskId = myAvailableTasks[0]?.id || '';
    setEntries((prev) => [
      ...prev,
      {
        work_item_id: defaultTaskId,
        activity_description: '',
        work_completed: '',
        hours_spent: 2,
        minutes_spent: 0,
        daily_progress_percentage: 10,
        reported_overall_progress: 25,
        blockers: '',
        next_steps: '',
        deliverable_url: '',
      },
    ]);
  };

  const removeEntryRow = (index: number) => {
    if (entries.length === 1) {
      setErrorMsg('You must have at least one work entry in your daily report.');
      return;
    }
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateEntryField = (index: number, field: keyof EntryFormState, value: any) => {
    setEntries((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry))
    );
  };

  // Calculate live total duration
  const totalMinutes = entries.reduce(
    (acc, curr) => acc + (Number(curr.hours_spent) || 0) * 60 + (Number(curr.minutes_spent) || 0),
    0
  );
  const totalHoursFormatted = (totalMinutes / 60).toFixed(2);

  const isReadOnly = existingReport?.status === 'approved' || existingReport?.status === 'submitted';

  const handleSave = async (isDraft: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (entries.length === 0) {
      setErrorMsg('Please add at least one work entry.');
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.work_item_id) {
        setErrorMsg(`Entry #${i + 1}: Please select an assigned work item.`);
        return;
      }
      if (!e.activity_description.trim()) {
        setErrorMsg(`Entry #${i + 1}: Activity description is required.`);
        return;
      }
      if (!e.work_completed.trim()) {
        setErrorMsg(`Entry #${i + 1}: Work completed description is required.`);
        return;
      }
      if (e.hours_spent < 0 || e.hours_spent > 24) {
        setErrorMsg(`Entry #${i + 1}: Hours spent must be between 0 and 24.`);
        return;
      }
      if (e.minutes_spent < 0 || e.minutes_spent >= 60) {
        setErrorMsg(`Entry #${i + 1}: Minutes spent must be between 0 and 59.`);
        return;
      }
      if (e.hours_spent === 0 && e.minutes_spent === 0) {
        setErrorMsg(`Entry #${i + 1}: Time spent must be greater than 0 minutes.`);
        return;
      }
      if (e.daily_progress_percentage < 0 || e.daily_progress_percentage > 100) {
        setErrorMsg(`Entry #${i + 1}: Daily progress must be between 0% and 100%.`);
        return;
      }
      if (e.reported_overall_progress < 0 || e.reported_overall_progress > 100) {
        setErrorMsg(`Entry #${i + 1}: Reported overall progress must be between 0% and 100%.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await saveDailyReport(
        reportDate,
        entries.map((e) => ({
          work_item_id: e.work_item_id,
          activity_description: e.activity_description,
          work_completed: e.work_completed,
          hours_spent: e.hours_spent,
          minutes_spent: e.minutes_spent,
          daily_progress_percentage: e.daily_progress_percentage,
          reported_overall_progress: e.reported_overall_progress,
          blockers: e.blockers || undefined,
          next_steps: e.next_steps || undefined,
          deliverable_url: e.deliverable_url || undefined,
        })),
        isDraft,
        existingReport?.id
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to save daily report.');
      } else {
        setSuccessMsg(
          isDraft
            ? 'Draft report saved successfully! You can return and continue editing anytime.'
            : 'Daily report successfully submitted for administrative review!'
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error saving report.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <CalendarCheck size={16} />
            <span>Employee Reporting Suite</span>
          </div>
          <h2 className="text-2xl font-bold text-white">My Daily Work Report</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Document daily security tasks, record accurate hours, deliverables, and log blockers.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {onNavigateHistory && (
            <button
              onClick={onNavigateHistory}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Report History
            </button>
          )}

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200">
            <span className="text-slate-400 font-medium">Date:</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent font-mono text-cyan-400 font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Revision Requested Notice */}
      {existingReport?.status === 'revision_requested' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <RotateCcw size={16} />
            <span>Revision Requested by Administrator</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Your manager reviewed this report and requested updates before approval. Please modify your work entries below and click <strong>Submit Daily Report</strong> to resubmit.
          </p>
        </div>
      )}

      {/* Read-Only Banner for Submitted or Approved */}
      {isReadOnly && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <StatusBadge status={existingReport.status} />
            <span>
              This report is in <strong>{existingReport.status}</strong> state.
              {existingReport.status === 'submitted'
                ? ' Awaiting administrative review.'
                : ' It has been approved by your manager and cannot be modified.'}
            </span>
          </div>
          {existingReport.status === 'submitted' && (
            <button
              onClick={() => handleSave(true)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
            >
              Convert to Draft to Edit
            </button>
          )}
        </div>
      )}

      {/* Feedback Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* No Assigned Tasks Warning */}
      {myAvailableTasks.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-amber-200">No active tasks currently assigned to your account</div>
            <p className="text-slate-400 mt-0.5">
              You are signed in as {profile?.full_name} ({profile?.employee_id}). Your administrator has not assigned active tasks to your profile yet. Once an administrator assigns you to a work item, it will automatically appear in your task selector below.
            </p>
          </div>
        </div>
      )}

      {/* Multi-Entry Form Rows */}
      <div className="space-y-5">
        {entries.map((entry, index) => {
          const selectedTask = workItems.find((w) => w.id === entry.work_item_id);

          return (
            <div
              key={index}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 relative"
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-600/20 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-white">Work Entry #{index + 1}</span>
                  {selectedTask && (
                    <span className="text-xs text-slate-400">
                      ({selectedTask.project_name || 'Standalone'})
                    </span>
                  )}
                </div>

                {!isReadOnly && entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntryRow(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors self-end sm:self-auto cursor-pointer"
                    title="Remove this work entry"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Task Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Assigned Work Item / Subtask
                </label>
                <select
                  disabled={isReadOnly}
                  value={entry.work_item_id}
                  onChange={(e) => updateEntryField(index, 'work_item_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                >
                  <option value="">-- Choose an assigned task --</option>
                  {myAvailableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.priority.toUpperCase()}] {t.title} ({t.project_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Description & Specific Work Completed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Activity Summary / Focus Area
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={entry.activity_description}
                    onChange={(e) => updateEntryField(index, 'activity_description', e.target.value)}
                    placeholder="e.g. Conducted automated and manual session fixation testing on login API endpoints..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Specific Work Accomplished
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={entry.work_completed}
                    onChange={(e) => updateEntryField(index, 'work_completed', e.target.value)}
                    placeholder="e.g. Replicated JWT token replay flaw, produced CVSS 7.5 calculation, and created reproduction curl script..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60 leading-relaxed"
                  />
                </div>
              </div>

              {/* Time Spent & Progress Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                {/* Hours Spent */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hours Spent (0-24)
                  </label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      disabled={isReadOnly}
                      value={entry.hours_spent}
                      onChange={(e) =>
                        updateEntryField(index, 'hours_spent', parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Minutes Spent */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Minutes Spent (0-59)
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    max="59"
                    disabled={isReadOnly}
                    value={entry.minutes_spent}
                    onChange={(e) =>
                      updateEntryField(index, 'minutes_spent', parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>

                {/* Daily Progress % */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Today's Effort %</label>
                    <span className="text-xs font-mono text-cyan-400">{entry.daily_progress_percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={isReadOnly}
                    value={entry.daily_progress_percentage}
                    onChange={(e) =>
                      updateEntryField(index, 'daily_progress_percentage', parseInt(e.target.value) || 0)
                    }
                    className="w-full accent-cyan-500 cursor-pointer disabled:opacity-60"
                  />
                </div>

                {/* Reported Overall Progress % */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Task Overall %</label>
                    <span className="text-xs font-mono text-emerald-400">{entry.reported_overall_progress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    disabled={isReadOnly}
                    value={entry.reported_overall_progress}
                    onChange={(e) =>
                      updateEntryField(index, 'reported_overall_progress', parseInt(e.target.value) || 0)
                    }
                    className="w-full accent-emerald-500 cursor-pointer disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Blockers & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Roadblocks / Blockers (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={entry.blockers}
                    onChange={(e) => updateEntryField(index, 'blockers', e.target.value)}
                    placeholder="e.g. Waiting for staging VPN access credentials..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Next Planned Steps (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={entry.next_steps}
                    onChange={(e) => updateEntryField(index, 'next_steps', e.target.value)}
                    placeholder="e.g. Test SQL injection vectors on search endpoint tomorrow..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Deliverable URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deliverable Artifact / Proof-of-Concept Link (Optional)
                </label>
                <div className="relative">
                  <Link size={14} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="url"
                    disabled={isReadOnly}
                    value={entry.deliverable_url}
                    onChange={(e) => updateEntryField(index, 'deliverable_url', e.target.value)}
                    placeholder="https://github.com/esecurityin/poc/issues/42 or report doc URL"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Entry Button & Summary Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        {!isReadOnly ? (
          <button
            type="button"
            onClick={addEntryRow}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Another Task Entry</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Day Duration:</span>
            <span className="text-lg font-bold font-mono text-white">
              {totalHoursFormatted} <span className="text-xs font-normal text-cyan-400">hours</span>
            </span>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <Save size={15} />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
              >
                <Send size={15} />
                <span>{isSaving ? 'Submitting...' : 'Submit Daily Report'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
