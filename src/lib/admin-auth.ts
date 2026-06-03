import {
  createClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 503 = 401
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

/** Shared admin gate for server actions and API routes. */
export async function requireAdminEmail(): Promise<string> {
  if (!isSupabaseServiceConfigured()) {
    throw new AdminAuthError("Supabase is not configured", 503);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new AdminAuthError("Sign in required", 401);
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    throw new AdminAuthError("Not authorized", 403);
  }
  return user.email;
}
