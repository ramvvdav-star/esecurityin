import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read strictly from Vite environment variables for production security
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const isConfigured = Boolean(
    envUrl &&
    envKey &&
    envUrl.startsWith('https://') &&
    !envUrl.includes('your-project-id') &&
    envKey.length > 20
  );

  return {
    url: envUrl,
    anonKey: envKey,
    isConfigured,
  };
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'esecurityin_supabase_auth_token',
      },
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  hasTables?: boolean;
}> {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return {
      success: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured.',
    };
  }

  try {
    const testClient = createClient(url, anonKey);
    const { error } = await testClient.from('profiles').select('id').limit(1);

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message?.includes('relation "public.profiles" does not exist') ||
        error.message?.includes('does not exist')
      ) {
        return {
          success: true,
          hasTables: false,
          message: 'Connected to Supabase project! Database tables are not yet created. Execute the SQL migration script in Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        message: `Supabase query error: ${error.message}`,
      };
    }

    return {
      success: true,
      hasTables: true,
      message: 'Connected to Supabase PostgreSQL database with active schemas.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network connection to Supabase failed.',
    };
  }
}
