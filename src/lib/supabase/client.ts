import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv, isSupabaseConfigured } from "./env";

export { isSupabaseConfigured } from "./env";

export function createClient() {
  const { url, anonKey: key } = getSupabasePublicEnv();
  if (!isSupabaseConfigured() || !url || !key) {
    throw new Error("Missing or invalid Supabase environment variables");
  }
  return createBrowserClient(url, key);
}
