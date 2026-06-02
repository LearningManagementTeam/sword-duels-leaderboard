/** Validates Supabase env vars (avoids build/runtime errors from bad Vercel config). */

function trimEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  // Users sometimes paste quotes from docs — strip them
  return trimmed.replace(/^["']|["']$/g, "");
}

export function getSupabasePublicEnv() {
  return {
    url: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export function getSupabaseServiceEnv() {
  return {
    ...getSupabasePublicEnv(),
    serviceRoleKey: trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

function isValidSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabasePublicEnv();
  return isValidSupabaseUrl(url) && Boolean(anonKey && anonKey.length > 20);
}

export function isSupabaseServiceConfigured(): boolean {
  const { serviceRoleKey } = getSupabaseServiceEnv();
  return (
    isSupabaseConfigured() &&
    Boolean(serviceRoleKey && serviceRoleKey.length > 20)
  );
}
