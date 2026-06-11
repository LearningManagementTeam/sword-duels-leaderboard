/**
 * Optional distributed rate limits (Upstash Redis).
 * When UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset, all checks pass.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitBlock = {
  retryAfterSeconds: number;
};

let redis: Redis | null | undefined;
let siteAccessLimiter: Ratelimit | null | undefined;
let adminApiLimiter: Ratelimit | null | undefined;
let adminHeavyLimiter: Ratelimit | null | undefined;

export function isRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  if (!isRateLimitConfigured()) {
    redis = null;
    return null;
  }
  redis = Redis.fromEnv();
  return redis;
}

function getSiteAccessLimiter(): Ratelimit | null {
  if (siteAccessLimiter !== undefined) return siteAccessLimiter;
  const client = getRedis();
  if (!client) {
    siteAccessLimiter = null;
    return null;
  }
  siteAccessLimiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(50, "15 m"),
    prefix: "rl:site-access",
    analytics: true,
  });
  return siteAccessLimiter;
}

function getAdminApiLimiter(): Ratelimit | null {
  if (adminApiLimiter !== undefined) return adminApiLimiter;
  const client = getRedis();
  if (!client) {
    adminApiLimiter = null;
    return null;
  }
  adminApiLimiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    prefix: "rl:admin-api",
    analytics: true,
  });
  return adminApiLimiter;
}

function getAdminHeavyLimiter(): Ratelimit | null {
  if (adminHeavyLimiter !== undefined) return adminHeavyLimiter;
  const client = getRedis();
  if (!client) {
    adminHeavyLimiter = null;
    return null;
  }
  adminHeavyLimiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(20, "10 m"),
    prefix: "rl:admin-heavy",
    analytics: true,
  });
  return adminHeavyLimiter;
}

async function runLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitBlock | null> {
  if (!limiter) return null;
  const result = await limiter.limit(key);
  if (result.success) return null;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );
  return { retryAfterSeconds };
}

/** Client IP for public gates (Vercel / proxies). */
export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export async function enforceSiteAccessRateLimit(
  request: Request
): Promise<RateLimitBlock | null> {
  const ip = clientIpFromRequest(request);
  return runLimit(getSiteAccessLimiter(), ip);
}

export async function enforceAdminApiRateLimit(
  adminEmail: string
): Promise<RateLimitBlock | null> {
  return runLimit(getAdminApiLimiter(), adminEmail.toLowerCase());
}

export async function enforceAdminHeavyRateLimit(
  adminEmail: string
): Promise<RateLimitBlock | null> {
  return runLimit(getAdminHeavyLimiter(), adminEmail.toLowerCase());
}

/** Test helper — reset cached clients between tests. */
export function resetRateLimitClientsForTests(): void {
  redis = undefined;
  siteAccessLimiter = undefined;
  adminApiLimiter = undefined;
  adminHeavyLimiter = undefined;
}
