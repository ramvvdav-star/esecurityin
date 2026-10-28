import React, { useState } from 'react';
import { Shield, Lock, Mail, User, Building, Briefcase, ArrowRight, AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onOpenResetPassword: () => void;
  onOpenSupabaseConfig: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onOpenResetPassword, onOpenSupabaseConfig }) => {
  const { signIn, signUp, authError, clearAuthError, isConfigured, supabaseConnected } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Cybersecurity Operations');
  const [jobTitle, setJobTitle] = useState('Security Specialist');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);
    clearAuthError();
    setSignupSuccess(null);

    try {
      if (mode === 'login') {
        const res = await signIn(email, password);
        if (!res.success) {
          setLocalError(res.error || 'Authentication failed. Please verify your credentials.');
        }
      } else {
        const res = await signUp(email, password, fullName, department, jobTitle);
        if (!res.success) {
          setLocalError(res.error || 'Account registration failed.');
        } else {
          setSignupSuccess(
            'Employee registration submitted! If email confirmation is enabled on your Supabase project, check your inbox.'
          );
          setMode('login');
        }
      }
    } catch (err: any) {
      setLocalError(err?.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 mb-4">
          <Shield size={32} className="stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          eSecurity<span className="text-cyan-400">In</span>
        </h1>
        <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mt-1">
          Employee Daily Work Tracker &amp; Task Management
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-7 relative z-10 backdrop-blur-md">
        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-slate-950 p-1 mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError(null);
              clearAuthError();
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'login'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Employee Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setLocalError(null);
              clearAuthError();
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'signup'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Registration
          </button>
        </div>

        {signupSuccess && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            <span>{signupSuccess}</span>
          </div>
        )}

        {displayedError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-rose-400" />
            <span>{displayedError}</span>
          </div>
        )}

        {!isConfigured && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
            <div className="font-semibold flex items-center gap-1.5">
              <Database size={14} />
              <span>Supabase Configuration Required</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your environment variables (.env.local or Vercel) to connect to your live project.
            </p>
            <button
              type="button"
              onClick={onOpenSupabaseConfig}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-medium cursor-pointer"
            >
              View Setup Instructions &amp; SQL Schema &rarr;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Offensive Security & Red Teaming">Offensive Security</option>
                    <option value="Cloud Security Architecture">Cloud Security</option>
                    <option value="SOC & Threat Intelligence">SOC &amp; IR</option>
                    <option value="Cybersecurity Operations">Operations</option>
                    <option value="GRC & Compliance">GRC &amp; Audit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Security Engineer"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Corporate Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@esecurityin.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Password</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={onOpenResetPassword}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isConfigured}
            className="w-full mt-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <>
                <span>Sign In to Tracker</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <span>Register Account</span>
            )}
          </button>
        </form>

        {/* Supabase Status Link */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {supabaseConnected ? 'Supabase Connected' : 'Supabase Required'}
          </span>
          <button
            type="button"
            onClick={onOpenSupabaseConfig}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Database size={13} />
            Setup &amp; SQL Schema
          </button>
        </div>
      </div>
    </div>
  );
};
