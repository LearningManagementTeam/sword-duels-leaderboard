import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabasePublicEnv,
  getSupabaseServiceEnv,
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
} from "./env";

export { isSupabaseConfigured, isSupabaseServiceConfigured } from "./env";

export async function createClient() {
  const { url, anonKey: key } = getSupabasePublicEnv();
  if (!isSupabaseConfigured() || !url || !key) {
    throw new Error("Missing or invalid Supabase environment variables");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — ignore
        }
      },
    },
  });
}

export async function createServiceClient() {
  const { url, serviceRoleKey: key } = getSupabaseServiceEnv();
  if (!isSupabaseServiceConfigured() || !url || !key) {
    throw new Error("Missing or invalid Supabase service role environment variables");
  }

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

