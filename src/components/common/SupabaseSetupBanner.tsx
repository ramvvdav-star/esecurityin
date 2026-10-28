import React from 'react';
import { Database, ShieldCheck, ExternalLink, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SupabaseSetupBannerProps {
  onOpenConfig: () => void;
}

export const SupabaseSetupBanner: React.FC<SupabaseSetupBannerProps> = ({ onOpenConfig }) => {
  const { isDemoMode, supabaseConnected, supabaseConfig } = useAuth();

  if (supabaseConnected) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-4 py-2 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Database size={14} className="text-emerald-400" />
          <span className="font-medium">Connected to Live Supabase:</span>
          <span className="font-mono text-emerald-200/80 max-w-xs truncate">{supabaseConfig.url}</span>
        </div>
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-1 hover:text-emerald-100 underline decoration-emerald-500/50 underline-offset-2 transition-colors cursor-pointer"
        >
          <Settings size={12} />
          View Connection & Schema
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-cyan-800/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 text-slate-200">
        <div className="p-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <Sparkles size={14} />
        </div>
        <div>
          <span className="font-semibold text-cyan-300">eSecurityIn Interactive Sandbox:</span>
          <span className="text-slate-300 ml-1.5 hidden sm:inline">
            Active with sample penetration testing data and instant Admin & Employee workflow testing.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenConfig}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-md shadow-sm transition-all cursor-pointer"
        >
          <Database size={13} />
          <span>Connect Your Supabase / View SQL</span>
        </button>
      </div>
    </div>
  );
};
