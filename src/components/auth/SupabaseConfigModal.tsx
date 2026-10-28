import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Server,
  FileCode,
  ShieldAlert,
  Rocket,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ESECURITYIN_SQL_SCHEMA } from '../../lib/sqlSchema';
import { getSupabaseCredentials } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { supabaseConnected, connectionStatus, isConfigured } = useAuth();
  const { url } = getSupabaseCredentials();

  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'admin' | 'vercel'>('status');
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedAdminCmd, setCopiedAdminCmd] = useState(false);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(ESECURITYIN_SQL_SCHEMA);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const adminBootstrapSQL = `UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-admin@esecurityin.com';`;

  const handleCopyAdminCmd = () => {
    navigator.clipboard.writeText(adminBootstrapSQL);
    setCopiedAdminCmd(true);
    setTimeout(() => setCopiedAdminCmd(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Supabase Architecture &amp; Security Reference
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PostgreSQL &amp; RLS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official schema migration, Row-Level Security policies, and controlled admin setup.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-900/80 text-sm">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'status'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server size={16} />
            Database Status
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode size={16} />
            PostgreSQL Migration SQL
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'admin'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert size={16} />
            Admin Provisioning
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vercel'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket size={16} />
            Vercel Deployment
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  supabaseConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {supabaseConnected ? (
                  <CheckCircle2 size={20} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="space-y-1 text-xs">
                  <h4 className="font-semibold text-sm">
                    {supabaseConnected ? 'Database Connected & Active' : 'Configuration Pending'}
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {connectionStatus?.message || (isConfigured ? 'Connecting to Supabase...' : 'Environment variables are required.')}
                  </p>
                  {url && (
                    <p className="font-mono text-slate-400 pt-1 text-[11px] truncate">
                      Target Project: {url}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-3">
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                  Environment Configuration (Production Architecture)
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Per strict security standards, database credentials and endpoints are locked to server environment variables and cannot be modified by browser users.
                </p>
                <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-cyan-300 space-y-1">
                  <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Full PostgreSQL Migration &amp; RLS Script</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copy and execute this script in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to initialize all tables, Row Level Security policies, and RPC transaction functions.
                  </p>
                </div>
                <button
                  onClick={handleCopySQL}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all shadow-sm cursor-pointer"
                >
                  {copiedSQL ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSQL ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
                  {ESECURITYIN_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-5 text-sm">
              <div>
                <h3 className="text-base font-semibold text-white">Controlled Administrator Provisioning</h3>
                <p className="text-xs text-slate-400 mt-1">
                  In accordance with company security policy, public registration forms NEVER grant administrator roles.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-cyan-300 text-xs uppercase tracking-wider">
                    Official Admin Bootstrap Query
                  </h4>
                  <button
                    onClick={handleCopyAdminCmd}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 cursor-pointer"
                  >
                    {copiedAdminCmd ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedAdminCmd ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. Have your primary administrator register their corporate email via the signup page.
                  <br />
                  2. As database owner, run this statement once in Supabase SQL Editor:
                </p>
                <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800">
                  {adminBootstrapSQL}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4 text-sm">
              <h3 className="text-base font-semibold text-white">Vercel Deployment Checklist</h3>
              <p className="text-xs text-slate-400">
                Steps to deploy this repository to production on Vercel:
              </p>

              <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Push to GitHub:</strong> Commit the source code to your company repository.
                </li>
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Import to Vercel:</strong> In Vercel, select the repository. Framework: Vite, root directory: <code>./</code>.
                </li>
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Set Environment Variables:</strong> Under Vercel Settings &gt; Environment Variables, add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
                </li>
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Configure Supabase Redirects:</strong> In Supabase Dashboard &gt; Auth &gt; URL Configuration, add your Vercel production URL.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">eSecurityIn Enterprise Task Tracker • Supabase PostgreSQL</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
