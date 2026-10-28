import React, { useState } from 'react';
import { ScrollText, ShieldAlert, Clock, User, Tag, Search, Filter } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useData();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const actions = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (
      search.trim() &&
      !log.action.toLowerCase().includes(search.toLowerCase()) &&
      !log.entity_type.toLowerCase().includes(search.toLowerCase()) &&
      !log.actor?.full_name.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ScrollText size={22} className="text-cyan-400" />
          Security Audit Trail
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable audit records of report approvals, revision requests, employee provisioning, and permission changes.
        </p>
      </div>

      {/* Filter and search */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Actions</option>
          {actions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    <div className="flex items-center gap-1.5 font-sans">
                      <Clock size={12} className="text-slate-500" />
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-200 font-sans">
                    <span className="font-semibold block">{log.actor?.full_name || 'System / Admin'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.actor_id?.slice(0, 8)}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300 font-sans text-xs">
                    <span className="text-slate-400 capitalize">{log.entity_type}</span>:
                    <span className="font-mono text-slate-500 ml-1 text-[11px]">{log.entity_id}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
