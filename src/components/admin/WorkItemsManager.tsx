import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderKanban,
  Check,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { WorkItem, ItemPriority, ItemStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { ProgressBar } from '../common/ProgressBar';
import { ConfirmModal } from '../common/ConfirmModal';

interface WorkItemsManagerProps {
  initialProjectId?: string | null;
}

export const WorkItemsManager: React.FC<WorkItemsManagerProps> = ({ initialProjectId }) => {
  const { profile } = useAuth();
  const { workItems, projects, profiles, createWorkItem, updateWorkItem, deleteWorkItem } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);

  // Form states
  const [projectId, setProjectId] = useState<string>(initialProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ItemPriority>('medium');
  const [status, setStatus] = useState<ItemStatus>('pending');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('16');
  const [overallProgress, setOverallProgress] = useState('0');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>(initialProjectId || 'all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeEmployees = profiles.filter((p) => p.is_active);

  const openCreateModal = () => {
    setEditingItem(null);
    setProjectId(initialProjectId || '');
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('pending');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDeadline('');
    setEstimatedHours('16');
    setOverallProgress('0');
    setSelectedAssigneeIds([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: WorkItem) => {
    setEditingItem(item);
    setProjectId(item.project_id || '');
    setTitle(item.title);
    setDescription(item.description || '');
    setPriority(item.priority);
    setStatus(item.status);
    setStartDate(item.start_date);
    setDeadline(item.deadline || '');
    setEstimatedHours(String(item.estimated_hours));
    setOverallProgress(String(item.overall_progress));
    setSelectedAssigneeIds(item.assigned_employees?.map((e) => e.id) || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleAssignee = (empId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const hours = parseFloat(estimatedHours) || 0;
    const progress = parseFloat(overallProgress) || 0;

    if (hours < 0) {
      setFormError('Estimated hours cannot be negative.');
      setIsSubmitting(false);
      return;
    }

    if (progress < 0 || progress > 100) {
      setFormError('Overall progress must be between 0 and 100%.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingItem) {
        const res = await updateWorkItem(
          editingItem.id,
          {
            project_id: projectId || null,
            title,
            description,
            priority,
            status,
            start_date: startDate,
            deadline: deadline || undefined,
            estimated_hours: hours,
            overall_progress: progress,
          },
          selectedAssigneeIds
        );
        if (!res.success) setFormError(res.error || 'Failed to update work item');
        else setIsModalOpen(false);
      } else {
        const res = await createWorkItem(
          {
            project_id: projectId || null,
            title,
            description,
            priority,
            status,
            start_date: startDate,
            deadline: deadline || undefined,
            estimated_hours: hours,
            overall_progress: progress,
            created_by: profile?.id,
          },
          selectedAssigneeIds
        );
        if (!res.success) setFormError(res.error || 'Failed to create work item');
        else setIsModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = workItems.filter((item) => {
    if (filterProject !== 'all') {
      if (filterProject === 'standalone' && item.project_id) return false;
      if (filterProject !== 'standalone' && item.project_id !== filterProject) return false;
    }
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare size={22} className="text-cyan-400" />
            Work Items &amp; Task Allocation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Assign security subtasks, set priorities, and track progress across engineering staff.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Work Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search work item title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            {/* Project Filter */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Projects &amp; Standalone</option>
              <option value="standalone">Standalone Tasks Only</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Project: {p.name}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            No work items match the selected filters.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      {item.project_name}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <PriorityBadge priority={item.priority} size="sm" />
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Progress and hours */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px]">
                    Est: <strong className="text-slate-200">{item.estimated_hours}h</strong>
                  </span>
                  <span className="font-semibold text-slate-200 font-mono">
                    Progress: {item.overall_progress}%
                  </span>
                </div>
                <ProgressBar progress={item.overall_progress} size="sm" />

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 font-mono">
                    <Calendar size={13} className="text-slate-500" />
                    Due: {item.deadline || 'No deadline'}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit work item"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete work item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Assigned employees */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Assigned Employees ({item.assigned_employees?.length || 0}):
                  </span>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {item.assigned_employees?.length === 0 ? (
                      <span className="text-[11px] text-amber-400 italic">Unassigned</span>
                    ) : (
                      item.assigned_employees?.map((emp) => (
                        <img
                          key={emp.id}
                          src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80'}
                          alt={emp.full_name}
                          title={`${emp.full_name} (${emp.employee_id})`}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 object-cover"
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingItem ? 'Edit Work Item' : 'Create & Assign Work Item'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Parent Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">None (Standalone Security Task)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Work Item Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. OAuth 2.0 PKCE Vulnerability Analysis"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed objectives, test cases, and deliverables..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ItemPriority)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ItemStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Overall Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overallProgress}
                    onChange={(e) => setOverallProgress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Multi-employee Assignees Picker */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Assign Employees (Multi-select)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {activeEmployees.map((emp) => {
                    const isSelected = selectedAssigneeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleAssignee(emp.id)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold truncate">{emp.full_name}</div>
                          <div className="text-[10px] text-slate-500">{emp.employee_id}</div>
                        </div>
                        {isSelected && <Check size={14} className="text-cyan-400 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Work Item' : 'Create & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Work Item"
        message="Are you sure you want to delete this work item? Any existing daily work report entries linked to it will be preserved."
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => {
          if (deleteId) deleteWorkItem(deleteId);
          setDeleteId(null);
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
