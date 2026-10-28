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
  MailCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ESECURITYIN_SQL_SCHEMA } from '../../lib/sqlSchema';
import { getSupabaseCredentials } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'status' | 'sql' | 'admin' | 'email_rate_limit' | 'vercel';
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose, initialTab = 'status' }) => {
  const { supabaseConnected, connectionStatus, isConfigured } = useAuth();
  const { url } = getSupabaseCredentials();

  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'admin' | 'email_rate_limit' | 'vercel'>(initialTab);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedAdminCmd, setCopiedAdminCmd] = useState(false);
  const [copiedRateLimitSQL, setCopiedRateLimitSQL] = useState(false);

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

  const rateLimitBypassSQL = `-- 1. Immediately auto-confirm all existing user accounts
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()) 
WHERE email_confirmed_at IS NULL;

-- 2. Add trigger to auto-confirm all future signups immediately
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();`;

  const handleCopyRateLimitSQL = () => {
    navigator.clipboard.writeText(rateLimitBypassSQL);
    setCopiedRateLimitSQL(true);
    setTimeout(() => setCopiedRateLimitSQL(false), 2500);
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
            onClick={() => setActiveTab('email_rate_limit')}
            className={`py-3 px-3 font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'email_rate_limit'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={16} className="text-amber-400" />
            <span>Remove Email Rate Limit</span>
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

          {activeTab === 'email_rate_limit' && (
            <div className="space-y-6 text-sm">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                  <Zap size={16} />
                  <span>Permanent Solution</span>
                </div>
                <h3 className="text-lg font-bold text-white">How to Remove the Supabase Email Rate Limiter</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Supabase includes a shared free SMTP mailer that throttles outgoing emails to <strong className="text-slate-200">3-4 emails per hour</strong>.
                  When email confirmation is enabled, every new signup triggers an email, quickly resulting in the error: <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded">over_email_send_rate_limit (429)</code>.
                </p>
              </div>

              {/* Solution 1: Disable Confirm Email (Recommended) */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    Recommended: Turn OFF "Confirm email" in Supabase (Takes 30 Seconds)
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Turning off email confirmation completely stops Supabase from attempting to send emails on signup.
                  Employees are provisioned immediately with instant login access, completely eliminating the rate limit!
                </p>
                <div className="p-3.5 bg-slate-950 rounded-lg text-xs space-y-1.5 border border-slate-800 text-slate-300">
                  <div className="font-semibold text-cyan-400">Step-by-step instructions:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Supabase Project Dashboard</a>.</li>
                    <li>In the left sidebar, click <strong className="text-white">Authentication</strong>.</li>
                    <li>Under Configuration, select <strong className="text-white">Providers</strong> &rarr; click <strong className="text-white">Email</strong>.</li>
                    <li>Toggle <strong className="text-amber-300">"Confirm email"</strong> to <strong className="text-rose-400">OFF</strong> (Disabled).</li>
                    <li>Click <strong className="text-white">Save</strong> at the bottom of the Email provider card.</li>
                  </ol>
                </div>
              </div>

              {/* Solution 2: SQL Auto-Confirm Trigger */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-bold text-white text-sm">
                      Database Level: Run Auto-Confirm &amp; Unlock SQL
                    </h4>
                  </div>
                  <button
                    onClick={handleCopyRateLimitSQL}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded-lg border border-slate-700 cursor-pointer font-medium"
                  >
                    {copiedRateLimitSQL ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedRateLimitSQL ? 'Copied SQL!' : 'Copy Auto-Confirm SQL'}
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Run this in your Supabase <strong>SQL Editor</strong>. It auto-confirms any existing locked user accounts and installs a database trigger that auto-confirms all future signups immediately:
                </p>
                <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800 overflow-x-auto max-h-48">
                  {rateLimitBypassSQL}
                </pre>
              </div>

              {/* Solution 3: Custom SMTP */}
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-bold text-white text-sm">
                    Production Email Delivery: Configure Custom SMTP
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If your enterprise requires automated email sending (such as password recovery links and welcome emails), replace Supabase&apos;s free shared mailer with a dedicated email service provider:
                </p>
                <div className="text-xs text-slate-400 space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <p>&bull; Go to <strong className="text-slate-200">Project Settings</strong> &rarr; <strong className="text-slate-200">Authentication</strong> &rarr; <strong className="text-slate-200">SMTP Settings</strong>.</p>
                  <p>&bull; Toggle ON <strong className="text-slate-200">Enable Custom SMTP</strong> and connect <strong>Resend</strong>, <strong>SendGrid</strong>, or <strong>Amazon SES</strong>.</p>
                  <p>&bull; This completely removes the 3-email-per-hour cap and uses your custom domain for secure email delivery.</p>
                </div>
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
