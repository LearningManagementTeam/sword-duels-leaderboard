# Whole-site password (branch managers)

The leaderboard is locked behind a **single site password** when `SITE_ACCESS_PASSWORD` is set in Vercel. Branch managers use this to view standings; central operators still sign in at `/admin` to score and edit HRIS data.

## Enable on Vercel

1. Open [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**.
2. Add:

| Name | Value |
|------|--------|
| `SITE_ACCESS_PASSWORD` | A strong password (at least 8 characters). Example: generate 20+ random chars in a password manager. |

3. Enable for **Production** (and **Preview** if branch managers test preview URLs).
4. **Redeploy** production (Deployments → ⋯ → Redeploy).

**Local dev:** Leave `SITE_ACCESS_PASSWORD` unset in `.env.local` so the site stays open while you build. To test the gate locally, set the same variable and restart `npm run dev`.

## How branch managers use it

1. Open the production URL (bookmark after first visit).
2. First visit (or after password change / cookie expiry): enter the **site password** on `/site-access`.
3. Browser remembers access for about **7 days**, then asks again.
4. Browse leaderboards normally — no admin login required for viewing.

**Do not** post the password in public Lark channels. Share only with branch managers in a confidential message.

## Central team (operators)

1. Pass the **site password** gate (same as managers).
2. Go to **Admin sign in** (`/admin/login`) with your Supabase email + password.
3. Score rounds, HRIS, etc.

Two layers: **site password** (view) + **admin account** (operate).

## Change the password

1. Vercel → **Environment Variables** → edit `SITE_ACCESS_PASSWORD`.
2. Redeploy production.
3. Notify branch managers with the new password.

Old browser sessions may work until their cookie expires (~7 days) or they clear cookies. For immediate lockout after a leak, deploy a new password and ask managers to clear site cookies or use a private browser window.

## Disable the gate

Remove `SITE_ACCESS_PASSWORD` from Vercel (or set it empty), then redeploy. The site becomes publicly reachable again.

## Announcement template (copy to Lark)

> **Revalida Leaderboard — branch managers only**  
> Link: `[your production URL]`  
> Site password: `[password from central team — confidential]`  
>  
> - For **viewing standings** only. Do not share the password or link with cashiers, trainees, or social media.  
> - First visit: enter the password once, then bookmark the site.  
> - Central team: after the site password, use **Admin sign in** to enter scores.
