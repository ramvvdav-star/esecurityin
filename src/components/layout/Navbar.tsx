import React, { useState } from 'react';
import {
  Shield,
  Bell,
  LogOut,
  User,
  Database,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface NavbarProps {
  onOpenSupabaseConfig: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSupabaseConfig,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const { profile, signOut, supabaseConnected } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, dailyReports } = useData();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userNotifications = notifications.filter((n) => n.recipient_id === profile?.id);
  const unreadCount = userNotifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Mobile menu toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
          <Shield size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
            eSecurity<span className="text-cyan-400">In</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block -mt-1">
            Task Tracker
          </span>
        </div>
      </div>

      {/* Right utilities */}
      <div className="flex items-center gap-3">
        {/* Supabase Connection Status Indicator */}
        <button
          onClick={onOpenSupabaseConfig}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            supabaseConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          }`}
          title="Click to view Supabase connection status & SQL schema"
        >
          <Database size={13} className={supabaseConnected ? 'text-emerald-400' : 'text-amber-400'} />
          <span>{supabaseConnected ? 'Supabase Live' : 'Supabase Config'}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center ring-2 ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-200">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {userNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No notifications right now.
                  </div>
                ) : (
                  userNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3.5 text-xs hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        !n.is_read ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        )}
                      </div>
                      <p className="text-slate-400 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-cyan-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
                {profile?.full_name ? profile.full_name.charAt(0) : 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-none">
                {profile?.full_name}
              </div>
              <div className="text-[10px] text-cyan-400 font-medium capitalize mt-1 leading-none">
                {profile?.role} • {profile?.employee_id}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-slate-200">
              <div className="px-3 py-2 border-b border-slate-800 text-slate-400">
                <div className="font-semibold text-slate-200">{profile?.full_name}</div>
                <div className="text-[11px] text-slate-400 truncate">{profile?.email}</div>
                <div className="text-[10px] text-cyan-400 mt-0.5">{profile?.department}</div>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenSupabaseConfig();
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2 text-slate-300 cursor-pointer"
              >
                <Database size={14} className="text-cyan-400" />
                Database &amp; SQL Settings
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  signOut();
                }}
                className="w-full px-3 py-2 text-left hover:bg-rose-950/30 text-rose-400 flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
