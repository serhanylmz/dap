import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(url && serviceKey);
}

let publicClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function supabasePublic(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Supabase public client not configured");
  }
  if (!publicClient) {
    publicClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return publicClient;
}

export function supabaseService(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error("Supabase service client not configured");
  }
  if (!serviceClient) {
    serviceClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }
  return serviceClient;
}
