import {
  createClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 503 = 401
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export class RateLimitError extends Error {
  constructor(readonly retryAfterSeconds = 60) {
    super("Too many requests. Please wait a moment and try again.");
    this.name = "RateLimitError";
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

/** Admin API routes — adds generous rate limits when Upstash is configured. */
export async function requireAdminEmailApi(options?: {
  heavy?: boolean;
}): Promise<string> {
  const email = await requireAdminEmail();
  const { enforceAdminApiRateLimit, enforceAdminHeavyRateLimit } = await import(
    "@/lib/rate-limit"
  );
  const blocked = options?.heavy
    ? await enforceAdminHeavyRateLimit(email)
    : await enforceAdminApiRateLimit(email);
  if (blocked) {
    throw new RateLimitError(blocked.retryAfterSeconds);
  }
  return email;
}

export function adminApiGuardResponse(err: unknown): NextResponse | null {
  if (err instanceof RateLimitError) {
    return NextResponse.json(
      { ok: false, error: err.message },
      {
        status: 429,
        headers: { "Retry-After": String(err.retryAfterSeconds) },
      }
    );
  }
  if (err instanceof AdminAuthError) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: err.status }
    );
  }
  return null;
}
