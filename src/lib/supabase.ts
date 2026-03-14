import { createClient } from "@supabase/supabase-js";

// Safe access to environment variables - check both VITE_ prefixed and non-prefixed
const getEnv = (key: string) => {
  try {
    // Try VITE_ prefixed first (for Vite client), then non-prefixed (for integration vars)
    return (import.meta as any).env[`VITE_${key}`] || (import.meta as any).env[key];
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = getEnv("SUPABASE_URL") || (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY") || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
