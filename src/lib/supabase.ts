import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'esecurityin_supabase_url';
const STORAGE_KEY_ANON = 'esecurityin_supabase_anon_key';

// Read from Vite environment variables or localStorage overrides
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean; isCustom: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    !url.includes('your-project-id') &&
    anonKey.length > 20
  );

  return {
    url,
    anonKey,
    isConfigured,
    isCustom: Boolean(storedUrl || storedKey),
  };
}

let cachedClient: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (cachedClient && currentClientUrl === url && currentClientKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentClientUrl = url;
    currentClientKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    cachedClient = null;
  }
}

export function clearCustomSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    cachedClient = null;
  }
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{
  success: boolean;
  message: string;
  hasTables?: boolean;
}> {
  const activeUrl = url || getSupabaseCredentials().url;
  const activeKey = key || getSupabaseCredentials().anonKey;

  if (!activeUrl || !activeKey || !activeUrl.startsWith('https://')) {
    return {
      success: false,
      message: 'Invalid Supabase URL or Anon key provided.',
    };
  }

  try {
    const testClient = createClient(activeUrl, activeKey);
    // Attempt a light select on public.profiles or projects
    const { data, error } = await testClient.from('profiles').select('id').limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.profiles" does not exist')) {
        return {
          success: true,
          hasTables: false,
          message: 'Connected to Supabase project! However, tables are not created yet. Please execute the SQL migration script.',
        };
      }
      return {
        success: false,
        message: `Supabase query returned: ${error.message}`,
      };
    }

    return {
      success: true,
      hasTables: true,
      message: 'Successfully connected to live Supabase database with active tables!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network connection failed.',
    };
  }
}
