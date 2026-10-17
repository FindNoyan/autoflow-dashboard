// Supabase browser client (Step 1).
// Reads ONLY NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
// If env vars are missing, returns null instead of crashing — the existing
// demo dashboard keeps working with no backend configured. Auth pages show
// a clear "Supabase is not configured yet" message in that case.
// Never put a service-role key or any secret in this file.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let cachedClient = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

// May be null when env vars are missing — callers must check.
export const supabase = getSupabaseClient();
