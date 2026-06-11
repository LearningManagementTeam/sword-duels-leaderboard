import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clientIpFromRequest,
  enforceAdminApiRateLimit,
  enforceSiteAccessRateLimit,
  isRateLimitConfigured,
  resetRateLimitClientsForTests,
} from "./rate-limit";

describe("rate-limit", () => {
  it("is disabled without Upstash env vars", () => {
    resetRateLimitClientsForTests();
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    assert.equal(isRateLimitConfigured(), false);
    if (prevUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    if (prevToken !== undefined) {
      process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
    }
  });

  it("passes through when Upstash is not configured", async () => {
    resetRateLimitClientsForTests();
    const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
    const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const request = new Request("https://example.com/api/site-access", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.10, 70.41.3.18" },
    });
    assert.equal(await enforceSiteAccessRateLimit(request), null);
    assert.equal(await enforceAdminApiRateLimit("ops@example.com"), null);
    assert.equal(clientIpFromRequest(request), "203.0.113.10");

    if (prevUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    if (prevToken !== undefined) {
      process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
    }
  });
});
