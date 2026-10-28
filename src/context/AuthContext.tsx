import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
} from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { INITIAL_PROFILES } from '../lib/demoData';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isDemoMode: boolean;
  supabaseConnected: boolean;
  supabaseConfig: { url: string; anonKey: string; isConfigured: boolean; isCustom: boolean };
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, department: string, jobTitle: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoRole: (role: UserRole, profileId?: string) => void;
  toggleDemoMode: (enableDemo: boolean) => void;
  configureSupabase: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  disconnectCustomSupabase: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ACTIVE_USER_ID_KEY = 'esecurityin_demo_user_id';
const DEMO_FORCE_MODE_KEY = 'esecurityin_force_demo_mode';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseCredentials());

  // Helper to load profile from Supabase
  const fetchSupabaseProfile = async (userId: string, userEmail: string): Promise<Profile | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('Profile fetch warning (may need SQL migration or first sign-up):', error?.message);
        // Fallback profile if row hasn't been created yet
        return {
          id: userId,
          employee_id: 'ESI-' + userId.slice(0, 4).toUpperCase(),
          full_name: userEmail.split('@')[0],
          email: userEmail,
          department: 'Cybersecurity Operations',
          job_title: 'Security Analyst',
          role: 'admin', // First user fallback
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return data as Profile;
    } catch (err) {
      console.error('Error fetching Supabase profile:', err);
      return null;
    }
  };

  // Setup initial auth session
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      setIsLoading(true);
      const credentials = getSupabaseCredentials();
      setSupabaseConfig(credentials);

      const forceDemo = localStorage.getItem(DEMO_FORCE_MODE_KEY) === 'true';

      if (credentials.isConfigured && !forceDemo) {
        const client = getSupabaseClient();
        if (client) {
          try {
            // Check connection
            const connTest = await testSupabaseConnection();
            if (connTest.success) {
              setSupabaseConnected(true);
              const { data: sessionData } = await client.auth.getSession();
              if (sessionData.session && mounted) {
                setSession(sessionData.session);
                setUser(sessionData.session.user);
                const prof = await fetchSupabaseProfile(sessionData.session.user.id, sessionData.session.user.email || '');
                if (mounted) setProfile(prof);
              }
              setIsDemoMode(false);
            } else {
              setSupabaseConnected(false);
              // Fallback to demo mode if database connection fails or tables aren't migrated
              activateDemoSession();
            }
          } catch (err) {
            console.error('Supabase init error:', err);
            activateDemoSession();
          }
        } else {
          activateDemoSession();
        }
      } else {
        // Not configured or forced demo: load realistic demo sandbox
        activateDemoSession();
      }

      if (mounted) setIsLoading(false);
    }

    function activateDemoSession() {
      setIsDemoMode(true);
      setSupabaseConnected(false);
      const savedUserId = localStorage.getItem(DEMO_ACTIVE_USER_ID_KEY) || 'usr_admin_alex';
      const initialProf = INITIAL_PROFILES.find((p) => p.id === savedUserId) || INITIAL_PROFILES[0];
      setProfile(initialProf);
      // Mock user object
      setUser({
        id: initialProf.id,
        email: initialProf.email,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: initialProf.full_name, role: initialProf.role },
        aud: 'authenticated',
        created_at: initialProf.created_at,
      } as any);
    }

    initializeAuth();

    // Listen for Supabase auth state changes if client configured
    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        if (newSession?.user) {
          setUser(newSession.user);
          const prof = await fetchSupabaseProfile(newSession.user.id, newSession.user.email || '');
          setProfile(prof);
          setIsDemoMode(false);
        } else if (!isDemoMode) {
          setUser(null);
          setProfile(null);
        }
      });

      return () => {
        mounted = false;
        authListener?.subscription?.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Demo user role switcher
  const switchDemoRole = (role: UserRole, profileId?: string) => {
    let targetProf: Profile | undefined;
    if (profileId) {
      targetProf = INITIAL_PROFILES.find((p) => p.id === profileId);
    } else {
      targetProf = INITIAL_PROFILES.find((p) => p.role === role);
    }

    if (targetProf) {
      setProfile(targetProf);
      setUser({
        id: targetProf.id,
        email: targetProf.email,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: targetProf.full_name, role: targetProf.role },
        aud: 'authenticated',
        created_at: targetProf.created_at,
      } as any);
      localStorage.setItem(DEMO_ACTIVE_USER_ID_KEY, targetProf.id);
    }
  };

  const toggleDemoMode = (enableDemo: boolean) => {
    if (enableDemo) {
      localStorage.setItem(DEMO_FORCE_MODE_KEY, 'true');
      setIsDemoMode(true);
      const savedUserId = localStorage.getItem(DEMO_ACTIVE_USER_ID_KEY) || 'usr_admin_alex';
      const prof = INITIAL_PROFILES.find((p) => p.id === savedUserId) || INITIAL_PROFILES[0];
      setProfile(prof);
      setUser({
        id: prof.id,
        email: prof.email,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: prof.full_name, role: prof.role },
        aud: 'authenticated',
        created_at: prof.created_at,
      } as any);
    } else {
      localStorage.removeItem(DEMO_FORCE_MODE_KEY);
      const creds = getSupabaseCredentials();
      if (creds.isConfigured) {
        setIsDemoMode(false);
        window.location.reload();
      }
    }
  };

  // Sign In function
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (isDemoMode || !supabaseConnected) {
      // In demo mode, find matching demo profile or accept credentials
      const matching = INITIAL_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (matching) {
        setProfile(matching);
        setUser({
          id: matching.id,
          email: matching.email,
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: matching.full_name, role: matching.role },
          aud: 'authenticated',
          created_at: matching.created_at,
        } as any);
        localStorage.setItem(DEMO_ACTIVE_USER_ID_KEY, matching.id);
        return { success: true };
      }
      // Demo fallback: if valid format, accept and create employee session
      if (email.includes('@') && password.length >= 6) {
        const customEmp: Profile = {
          id: 'demo_' + Date.now(),
          employee_id: 'ESI-' + Math.floor(100 + Math.random() * 900),
          full_name: email.split('@')[0].replace(/[._]/g, ' '),
          email: email,
          department: 'Cybersecurity Operations',
          job_title: 'Security Specialist',
          role: email.includes('admin') ? 'admin' : 'employee',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(customEmp);
        setUser({
          id: customEmp.id,
          email: customEmp.email,
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: customEmp.full_name, role: customEmp.role },
          aud: 'authenticated',
          created_at: customEmp.created_at,
        } as any);
        return { success: true };
      }
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client is not configured.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const prof = await fetchSupabaseProfile(data.user.id, data.user.email || '');
        if (prof && !prof.is_active) {
          await client.auth.signOut();
          setUser(null);
          setProfile(null);
          return { success: false, error: 'Your account has been deactivated. Please contact your administrator.' };
        }
        setProfile(prof);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed.' };
    }
  };

  // Sign Up function
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    department: string,
    jobTitle: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isDemoMode || !supabaseConnected) {
      const newProf: Profile = {
        id: 'usr_new_' + Date.now(),
        employee_id: 'ESI-' + Math.floor(100 + Math.random() * 900),
        full_name: fullName,
        email: email,
        department: department || 'Cybersecurity Operations',
        job_title: jobTitle || 'Security Analyst',
        role: 'employee',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(newProf);
      setUser({
        id: newProf.id,
        email: newProf.email,
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: newProf.full_name, role: 'employee' },
        aud: 'authenticated',
        created_at: newProf.created_at,
      } as any);
      return { success: true };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase client is not initialized.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            department,
            job_title: jobTitle,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const prof = await fetchSupabaseProfile(data.user.id, data.user.email || '');
        setProfile(prof);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed.' };
    }
  };

  // Sign Out function
  const signOut = async () => {
    const client = getSupabaseClient();
    if (client && !isDemoMode) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Reset Password function
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isDemoMode || !supabaseConnected) {
      return {
        success: true,
      };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
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

  // Configure Supabase dynamically from the UI
  const configureSupabase = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
    const testResult = await testSupabaseConnection(url, anonKey);
    if (!testResult.success) {
      return {
        success: false,
        message: testResult.message,
      };
    }

    saveCustomSupabaseCredentials(url, anonKey);
    setSupabaseConfig(getSupabaseCredentials());
    setSupabaseConnected(true);
    setIsDemoMode(false);
    localStorage.removeItem(DEMO_FORCE_MODE_KEY);

    return {
      success: true,
      message: testResult.message,
    };
  };

  const disconnectCustomSupabase = () => {
    clearCustomSupabaseCredentials();
    setSupabaseConfig(getSupabaseCredentials());
    setSupabaseConnected(false);
    setIsDemoMode(true);
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isDemoMode,
        supabaseConnected,
        supabaseConfig,
        signIn,
        signUp,
        signOut,
        resetPassword,
        switchDemoRole,
        toggleDemoMode,
        configureSupabase,
        disconnectCustomSupabase,
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
