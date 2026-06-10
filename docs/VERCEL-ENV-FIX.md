# Fix Vercel deploy error: Invalid supabaseUrl

## What went wrong

Vercel tried to build the site but the **Supabase URL** environment variable was missing, empty, or not a valid `https://….supabase.co` link.

## Fix in Vercel (you do this)

1. Open [vercel.com](https://vercel.com) → your project **sword-duels-leaderboard**
2. Top menu → **Settings** → **Environment Variables**
3. Check these **four** rows exist (names must match **exactly**):

| Name | Correct value looks like |
|------|---------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefghijk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Long text starting with `eyJ…` |
| `SUPABASE_SERVICE_ROLE_KEY` | Long text starting with `eyJ…` (different from anon) |
| `SITE_ACCESS_PASSWORD` | Strong site password (8+ chars) — see [SITE-ACCESS.md](./SITE-ACCESS.md) |

4. Common mistakes — **avoid**:
   - Extra spaces before/after the value
   - Wrapping in quotes `"https://…"`
   - Pasting the **wrong** key into the URL field
   - Missing `https://` at the start
   - Using the database password instead of API keys

5. For each variable, enable **Production** (and **Preview** if shown).
6. Go to **Deployments** → latest failed deploy → **⋯** menu → **Redeploy**  
   (or push the code fix from GitHub and Vercel will redeploy automatically)

## Where to copy values again

Supabase → **Project Settings** → **API** → Project URL, anon public, service_role secret.
