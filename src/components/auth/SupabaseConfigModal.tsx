import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Server,
  RefreshCw,
  Terminal,
  FileCode,
  Rocket,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ESECURITYIN_SQL_SCHEMA } from '../../lib/sqlSchema';
import { testSupabaseConnection } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { supabaseConfig, configureSupabase, disconnectCustomSupabase, isDemoMode } = useAuth();

  const [activeTab, setActiveTab] = useState<'connect' | 'sql' | 'admin' | 'vercel'>('connect');
  const [urlInput, setUrlInput] = useState(supabaseConfig.url || '');
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedAdminCmd, setCopiedAdminCmd] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || !keyInput) {
      setStatusMessage({ type: 'error', text: 'Please enter both the Supabase URL and Anon Key.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Pinging Supabase REST endpoint...' });

    try {
      const result = await configureSupabase(urlInput, keyInput);
      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

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
                Supabase Integration Hub
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PostgreSQL & RLS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure live Supabase connection, export SQL schema migrations, and manage RLS security.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-900/80 text-sm">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'connect'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server size={16} />
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode size={16} />
            SQL Schema Migration
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 ${
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
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 ${
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
          {activeTab === 'connect' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-sm">
                <h4 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal size={16} className="text-cyan-400" />
                  Live Connection Status
                </h4>
                <div className="mt-2 text-xs text-slate-400 space-y-1">
                  <p>
                    <strong>Current Mode:</strong>{' '}
                    <span className={supabaseConfig.isConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {supabaseConfig.isConfigured ? 'Connected to Supabase Project' : 'Interactive Demo Sandbox Mode'}
                    </span>
                  </p>
                  {supabaseConfig.url && (
                    <p className="font-mono text-slate-300 break-all">URL: {supabaseConfig.url}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleTestAndSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Found in your Supabase Dashboard under <strong>Project Settings &gt; API</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Supabase Anon / Public Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <textarea
                    rows={3}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Public client key with safe Row Level Security enforcement. Never use service-role key.
                  </p>
                </div>

                {statusMessage && (
                  <div
                    className={`p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : statusMessage.type === 'error'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {statusMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {supabaseConfig.isCustom ? (
                    <button
                      type="button"
                      onClick={disconnectCustomSupabase}
                      className="px-4 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-800/40"
                    >
                      Clear Stored Credentials
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white font-medium text-sm rounded-lg shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
                    >
                      {isTesting ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
                      <span>{isTesting ? 'Validating Connection...' : 'Save & Test Connection'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Full PostgreSQL Migration & RLS Script</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copy and run this in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to initialize all 10 tables and RLS security rules.
                  </p>
                </div>
                <button
                  onClick={handleCopySQL}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all shadow-sm"
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
                <h3 className="text-base font-semibold text-white">Initial Administrator Provisioning</h3>
                <p className="text-xs text-slate-400 mt-1">
                  eSecurityIn security policies forbid unauthenticated visitors from self-registering as admins. Use one of these two certified bootstrap methods:
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                <h4 className="font-semibold text-cyan-300 text-xs uppercase tracking-wider">
                  Method 1: Automatic First-User Bootstrap (Recommended)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The database migration script includes an automatic check inside the <code>handle_new_user()</code> trigger function. When your database has 0 user profiles, the very first user who signs up through the app is granted the <code>admin</code> role automatically!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-cyan-300 text-xs uppercase tracking-wider">
                    Method 2: Explicit SQL Elevation
                  </h4>
                  <button
                    onClick={handleCopyAdminCmd}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700"
                  >
                    {copiedAdminCmd ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedAdminCmd ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <p className="text-xs text-slate-300">
                  Register with your corporate email in the app, then execute this query in Supabase SQL Editor:
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
                Follow these 5 steps to deploy this repository to production on Vercel:
              </p>

              <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Push to GitHub:</strong> Commit the source code to your company repository (e.g. <code>https://github.com/eSecurityIn/employee-task-tracker</code>).
                </li>
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Import into Vercel:</strong> In Vercel, select Vite preset and root directory <code>./</code>.
                </li>
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Configure Environment Variables:</strong> In Vercel Project Settings &gt; Environment Variables, add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
                </li>
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Set Supabase Redirect URLs:</strong> In Supabase Dashboard &gt; Auth &gt; URL Configuration, add your Vercel deployment URL (e.g. <code>https://esecurityin-tracker.vercel.app/**</code>).
                </li>
                <li className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 leading-relaxed">
                  <strong className="text-white">Verify Deployment:</strong> Log in with your admin account to verify live persistence, task allocations, and daily reports.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">eSecurityIn Enterprise Task Tracker • Supabase RLS Protected</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
