# Rate limiting (optional)

Distributed rate limits protect sensitive endpoints from brute-force and abuse. Limits are **generous** so normal branch managers and central operators should not hit them during regular work.

## Behavior without setup

If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are **not** set, rate limiting is **off** — same as before. Local dev and deployments without Upstash are unchanged.

## Enable on Vercel (recommended for production)

1. Open [vercel.com](https://vercel.com) → your project → **Storage** → **Create** → **Upstash Redis** (free tier is enough).
2. Connect the database to this project. Vercel adds:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy production (and preview if you use the site password gate there).

No code changes are required after env vars are set.

## What is limited

| Endpoint | Limit | Scope |
|----------|-------|--------|
| `POST /api/site-access` | 50 requests / 15 min | Per IP |
| Admin API routes (export, HRIS photo, branding uploads) | 120 requests / 1 min | Per signed-in admin email |
| `POST /api/hris/extract-roster` | 20 requests / 10 min | Per signed-in admin email |

**Not limited:** public leaderboard pages, server actions after admin login (normal scoring/HRIS edits), Supabase Auth sign-in (Supabase applies its own throttles).

## If someone hits a limit

- **Site password:** user sees “Too many attempts from this network” on `/site-access`. Wait a few minutes.
- **Admin API:** JSON `429` with `Retry-After`. Rare unless a script is hammering an endpoint.

## Operations note

Central team doing heavy roster OCR in one session stays under 20 extract calls per 10 minutes. Bulk CSV work uses server actions (not rate-limited here). If a limit ever blocks real work, raise the numbers in `src/lib/rate-limit.ts` or temporarily unset Upstash env vars and redeploy.
