import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Mail,
  Building,
  Briefcase,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Profile, UserRole } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

export const EmployeesManager: React.FC = () => {
  const { profile: currentAdmin } = useAuth();
  const { profiles, createEmployeeAccount, toggleProfileStatus, updateProfileRole } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Provisioning modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Offensive Security & Red Teaming');
  const [jobTitle, setJobTitle] = useState('Security Engineer');
  const [role, setRole] = useState<UserRole>('employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Status toggle confirmation
  const [toggleStatusTarget, setToggleStatusTarget] = useState<{ profile: Profile; newStatus: boolean } | null>(null);

  const departments = Array.from(new Set(profiles.map((p) => p.department)));

  const filteredProfiles = profiles.filter((p) => {
    if (selectedDept !== 'all' && p.department !== selectedDept) return false;
    if (selectedRole !== 'all' && p.role !== selectedRole) return false;
    if (
      searchQuery.trim() &&
      !p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await createEmployeeAccount({
        full_name: fullName,
        email,
        department,
        job_title: jobTitle,
        role,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to provision account');
      } else {
        setIsModalOpen(false);
        setFullName('');
        setEmail('');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-cyan-400" />
            Employee Directory &amp; Access Control
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Provision employee credentials, manage security roles, and enforce active employment access.
          </p>
        </div>

        <button
          onClick={() => {
            setFullName('');
            setEmail('');
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-900/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={16} />
          <span>Provision New Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="employee">Employees</option>
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map((emp) => {
          const isSelf = emp.id === currentAdmin?.id;

          return (
            <div
              key={emp.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all shadow-sm flex flex-col justify-between space-y-4 ${
                !emp.is_active ? 'border-rose-900/40 opacity-70' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {emp.avatar_url ? (
                      <img
                        src={emp.avatar_url}
                        alt={emp.full_name}
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-base">
                        {emp.full_name.charAt(0)}
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {emp.full_name}
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                            You
                          </span>
                        )}
                      </h3>
                      <span className="font-mono text-xs text-cyan-400 font-semibold block">
                        {emp.employee_id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                      emp.role === 'admin'
                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {emp.role}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Briefcase size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="truncate text-slate-300 font-medium">{emp.job_title}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      emp.is_active ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span className={emp.is_active ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
                    {emp.is_active ? 'Active Status' : 'Deactivated'}
                  </span>
                </div>

                {!isSelf && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateProfileRole(emp.id, emp.role === 'admin' ? 'employee' : 'admin')
                      }
                      className="text-[11px] text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                      title={emp.role === 'admin' ? 'Demote to Employee' : 'Promote to Admin'}
                    >
                      {emp.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() =>
                        setToggleStatusTarget({ profile: emp, newStatus: !emp.is_active })
                      }
                      className={`text-[11px] font-medium transition-colors ${
                        emp.is_active
                          ? 'text-rose-400 hover:text-rose-300'
                          : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {emp.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Provision Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200">
            <h3 className="text-lg font-bold text-white mb-2">Provision New Employee Account</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter employee credentials. For production, invite emails will trigger a secure password creation link.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. David Thorne"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="david.thorne@esecurityin.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Offensive Security & Red Teaming">Offensive Security &amp; Red Teaming</option>
                  <option value="Cloud Security Architecture">Cloud Security Architecture</option>
                  <option value="SOC & Threat Intelligence">SOC &amp; Threat Intelligence</option>
                  <option value="Cybersecurity Operations">Cybersecurity Operations</option>
                  <option value="GRC & Compliance">GRC &amp; Compliance</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Senior Incident Responder"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="employee">Employee (Standard Access)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
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
                  {isSubmitting ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate confirmation */}
      {toggleStatusTarget && (
        <ConfirmModal
          isOpen={true}
          title={toggleStatusTarget.newStatus ? 'Reactivate Account' : 'Deactivate Account'}
          message={`Are you sure you want to ${
            toggleStatusTarget.newStatus ? 'reactivate' : 'deactivate'
          } ${toggleStatusTarget.profile.full_name}'s account? Inactive employees are blocked by Row Level Security from accessing protected application APIs.`}
          confirmLabel={toggleStatusTarget.newStatus ? 'Reactivate' : 'Deactivate'}
          isDestructive={!toggleStatusTarget.newStatus}
          onConfirm={() => {
            toggleProfileStatus(toggleStatusTarget.profile.id, toggleStatusTarget.newStatus);
            setToggleStatusTarget(null);
          }}
          onClose={() => setToggleStatusTarget(null)}
        />
      )}
    </div>
  );
};
