import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Archive,
  Edit2,
  Trash2,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Project, ProjectStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ProgressBar } from '../common/ProgressBar';
import { ConfirmModal } from '../common/ConfirmModal';
import { getTodayDateString } from '../../lib/dateUtils';

interface ProjectsManagerProps {
  onOpenCreateWorkItemWithProject?: (projectId: string) => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ onOpenCreateWorkItemWithProject }) => {
  const { profile } = useAuth();
  const { projects, workItems, createProject, updateProject, deleteProject } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setStatus('active');
    setStartDate(getTodayDateString());
    setDeadline('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setStatus(p.status);
    setStartDate(p.start_date);
    setDeadline(p.deadline || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingProject) {
        const res = await updateProject(editingProject.id, {
          name,
          description,
          status,
          start_date: startDate,
          deadline: deadline || undefined,
        });
        if (!res.success) setFormError(res.error || 'Failed to update project');
        else setIsModalOpen(false);
      } else {
        const res = await createProject({
          name,
          description,
          status,
          start_date: startDate,
          deadline: deadline || undefined,
          created_by: profile?.id,
        });
        if (!res.success) setFormError(res.error || 'Failed to create project');
        else setIsModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban size={22} className="text-cyan-400" />
            Project Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage cybersecurity engagements, subtask breakdown, and delivery milestones.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search project name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            No projects found matching the filter criteria.
          </div>
        ) : (
          filteredProjects.map((project) => {
            const projectWorkItems = workItems.filter((w) => w.project_id === project.id);
            const totalEstimatedHours = projectWorkItems.reduce((acc, curr) => acc + curr.estimated_hours, 0);
            const avgProgress =
              projectWorkItems.length > 0
                ? Math.round(
                    projectWorkItems.reduce((acc, curr) => acc + curr.overall_progress, 0) /
                      projectWorkItems.length
                  )
                : 0;

            return (
              <div
                key={project.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white">{project.name}</h3>
                      <StatusBadge status={project.status} size="sm" />
                    </div>
                    {project.description && (
                      <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                        {project.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={13} className="text-cyan-400" />
                        Start: {project.start_date}
                      </span>
                      {project.deadline && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={13} className="text-amber-400" />
                          Deadline: {project.deadline}
                        </span>
                      )}
                      <span>
                        Estimated Hours:{' '}
                        <strong className="text-slate-200 font-mono">{totalEstimatedHours}h</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-start">
                    <button
                      onClick={() => openEditModal(project)}
                      className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteId(project.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Overall Project Progress</span>
                    <span className="font-semibold text-slate-200">{avgProgress}%</span>
                  </div>
                  <ProgressBar progress={avgProgress} />
                </div>

                {/* Subtasks summary */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Work Items &amp; Subtasks ({projectWorkItems.length})
                    </span>
                    {onOpenCreateWorkItemWithProject && (
                      <button
                        onClick={() => onOpenCreateWorkItemWithProject(project.id)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        + Add Subtask
                      </button>
                    )}
                  </div>

                  {projectWorkItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No subtasks added yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {projectWorkItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div className="truncate mr-2">
                            <span className="font-medium text-slate-200 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.assigned_employees?.map((e) => e.full_name).join(', ') || 'Unassigned'}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-cyan-400 flex-shrink-0">
                            {item.overall_progress}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. FinTech API Penetration Test"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scope, client objectives, and compliance targets..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
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
                  {isSubmitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Project"
        message="Are you sure you want to delete this project? Existing work items will be detached and become standalone tasks. Historical reports are retained."
        confirmLabel="Delete"
        isDestructive
        onConfirm={() => {
          if (deleteId) deleteProject(deleteId);
          setDeleteId(null);
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
