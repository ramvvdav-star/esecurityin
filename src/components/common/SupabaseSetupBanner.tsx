import React from 'react';
import { Database, ShieldCheck, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseCredentials } from '../../lib/supabase';

interface SupabaseSetupBannerProps {
  onOpenConfig: () => void;
}

export const SupabaseSetupBanner: React.FC<SupabaseSetupBannerProps> = ({ onOpenConfig }) => {
  const { supabaseConnected, isConfigured } = useAuth();
  const { url } = getSupabaseCredentials();

  if (supabaseConnected) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-4 py-2 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Database size={14} className="text-emerald-400" />
          <span className="font-medium">Live Supabase Database:</span>
          <span className="font-mono text-emerald-200/80 max-w-xs truncate">{url}</span>
        </div>
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-1 hover:text-emerald-100 underline decoration-emerald-500/50 underline-offset-2 transition-colors cursor-pointer"
        >
          <Settings size={12} />
          <span>View Schema &amp; Security Rules</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-300">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
        <div>
          <span className="font-semibold text-amber-200">Supabase Connection Notice:</span>
          <span className="text-slate-300 ml-1.5 hidden sm:inline">
            {isConfigured
              ? 'Attempting connection or tables are awaiting initial SQL migration.'
              : 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect.'}
          </span>
        </div>
      </div>

      <button
        onClick={onOpenConfig}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 font-medium rounded-md shadow-sm transition-all cursor-pointer"
      >
        <Database size={13} />
        <span>View SQL Schema &amp; Instructions</span>
      </button>
    </div>
  );
};
