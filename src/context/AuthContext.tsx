import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseCredentials, testSupabaseConnection } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  authError: string | null;
  isConfigured: boolean;
  supabaseConnected: boolean;
  connectionStatus: { success: boolean; message: string; hasTables?: boolean } | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, department: string, jobTitle: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string; hasTables?: boolean } | null>(null);

  const { isConfigured } = getSupabaseCredentials();

  // Securely fetch profile from Supabase profiles table
  const fetchProfile = useCallback(async (userId: string): Promise<{ profile: Profile | null; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { profile: null, error: 'Supabase client is not configured.' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return { profile: null, error: `Failed to load employee profile: ${error.message}` };
      }

      if (!data) {
        return {
          profile: null,
          error: 'Your account authenticated successfully, but no employee profile record exists in the database. Please contact an administrator.',
        };
      }

      const prof = data as Profile;

      // Enforce active account check
      if (!prof.is_active) {
        return {
          profile: null,
          error: 'Your employee account has been deactivated. Please contact your company administrator.',
        };
      }

      return { profile: prof };
    } catch (err: any) {
      return { profile: null, error: err?.message || 'Unexpected error loading profile.' };
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      setIsLoading(true);
      setAuthError(null);

      if (!isConfigured) {
        setIsLoading(false);
        setSupabaseConnected(false);
        setConnectionStatus({
          success: false,
          message: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not configured.',
        });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        setIsLoading(false);
        return;
      }

      try {
        const conn = await testSupabaseConnection();
        if (isMounted) {
          setConnectionStatus(conn);
          setSupabaseConnected(conn.success);
        }

        const { data: sessionData, error: sessionErr } = await client.auth.getSession();
        if (sessionErr) {
          console.error('Session retrieval error:', sessionErr);
        }

        if (sessionData.session?.user && isMounted) {
          const { profile: loadedProfile, error: profileErr } = await fetchProfile(sessionData.session.user.id);

          if (profileErr || !loadedProfile) {
            // Profile failed or deactivated: sign out immediately, never elevate or assign fallback
            await client.auth.signOut();
            if (isMounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setAuthError(profileErr || 'Authentication failed: profile not found.');
            }
          } else if (isMounted) {
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            setProfile(loadedProfile);
          }
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        if (isMounted) setAuthError(err?.message || 'Failed to initialize authentication.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen for auth state changes
    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          // Clear any user-specific cached local data
          try {
            sessionStorage.clear();
          } catch (_) {}
          return;
        }

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);

          const { profile: loadedProfile, error: profileErr } = await fetchProfile(newSession.user.id);
          if (profileErr || !loadedProfile) {
            await client.auth.signOut();
            if (isMounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setAuthError(profileErr || 'Account denied: invalid or deactivated profile.');
            }
          } else if (isMounted) {
            setProfile(loadedProfile);
            setAuthError(null);
          }
        }
      });

      return () => {
        isMounted = false;
        authListener?.subscription?.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isConfigured, fetchProfile]);

  const refreshProfile = async () => {
    if (!user) return;
    const { profile: updatedProfile, error } = await fetchProfile(user.id);
    if (error || !updatedProfile) {
      await signOut();
      setAuthError(error || 'Session expired or profile deactivated.');
    } else {
      setProfile(updatedProfile);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const client = getSupabaseClient();

    if (!client) {
      const msg = 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication returned no user record.' };
      }

      const { profile: loadedProfile, error: profileErr } = await fetchProfile(data.user.id);

      if (profileErr || !loadedProfile) {
        await client.auth.signOut();
        const errDesc = profileErr || 'Unable to retrieve employee profile.';
        setAuthError(errDesc);
        return { success: false, error: errDesc };
      }

      setUser(data.user);
      setSession(data.session);
      setProfile(loadedProfile);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Login attempt failed.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    department: string,
    jobTitle: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const client = getSupabaseClient();

    if (!client) {
      const msg = 'Supabase is not configured.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters for security compliance.' };
    }

    try {
      // Public signup is strictly limited to role: 'employee'
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            department: department.trim(),
            job_title: jobTitle.trim(),
            role: 'employee', // Explicitly prevent privilege escalation
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        setUser(data.user);
        setSession(data.session);
        const { profile: loadedProfile, error: profileErr } = await fetchProfile(data.user.id);
        if (loadedProfile) setProfile(loadedProfile);
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Registration failed.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.error('Error during signOut:', err);
      }
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    setAuthError(null);
    try {
      sessionStorage.clear();
    } catch (_) {}
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client is not configured.' };
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Password reset request failed.' };
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        authError,
        isConfigured,
        supabaseConnected,
        connectionStatus,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
