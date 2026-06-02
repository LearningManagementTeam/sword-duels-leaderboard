# Sword Duels Dynamic Leaderboard

## New here? Start here (no coding)

**[Setup guide for beginners](docs/SETUP-FOR-BEGINNERS.md)** — step-by-step: what you do in Supabase and Vercel.

- [Printable checklist](docs/CHECKLIST.md)
- [Daily operations during the competition](docs/DAILY-OPERATIONS.md)
- In Cursor, ask: *“Use the sword-duels-leaderboard skill to help me deploy.”*

---

Public leaderboard and central admin console for the June–August competition:

- **June (Area-wide):** 130+ branches, 3 rounds, top **24** advance
- **July (Regional):** 24 survivors by Luzon / NCR / VisMin, **1 champion per region**
- **August (Finals):** 3 regional champions

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [Supabase](https://supabase.com/) (Postgres, Auth, RLS)
- Tailwind CSS 4

## Setup

### 1. Supabase project

**Non-developers:** follow [`docs/SETUP-FOR-BEGINNERS.md`](docs/SETUP-FOR-BEGINNERS.md) and run [`supabase/ALL-IN-ONE-MIGRATION.sql`](supabase/ALL-IN-ONE-MIGRATION.sql) once in the SQL Editor.

**Developers:** run migrations in order, or use the all-in-one file above.

3. Copy API keys to `.env.local` (see [`.env.local.example`](.env.local.example)) or Vercel env vars.

### 2. App

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. First admin user

1. In Supabase Dashboard → **Authentication** → **Users**, create a user (email + password).
2. Run in SQL editor (replace email):

```sql
INSERT INTO admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'your-admin@company.com';
```

3. Sign in at [/admin/login](http://localhost:3000/admin/login).

### 4. Seed branches

1. Admin → **Branches** → **Import branches from CSV**  
   Uses [`data/branches.csv`](data/branches.csv) (142 sample branches). Replace with your official list (same columns: `branch_code,branch_name,area,region`).

Regenerate sample CSV:

```bash
node scripts/generate-branches-csv.mjs
```

## Admin workflow

1. **Enter results** — Admin → Rounds → pick round → enter points/wins/losses → **Save draft** or **Save & publish**.
2. **Publish** recomputes cumulative standings on the public site.
3. **Lock & advance** — After June ends, Admin → Advancement → lock June (seeds top 24 into July). Repeat after July for August.

## Public routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/june` | Area-wide standings (cut line at 24) |
| `/july` | Regional hub |
| `/july/luzon`, `/july/ncr`, `/july/vismin` | Per-region boards |
| `/august` | Finals |
| `/tv?phase=june` | Fullscreen TV mode (30s revalidate) |
| `/api/export/june` | CSV export |

## Scoring rules

Documented in [`docs/mechanics.md`](docs/mechanics.md). Logic lives in [`src/lib/scoring.ts`](src/lib/scoring.ts) and [`src/lib/scoring-config.ts`](src/lib/scoring-config.ts).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `node scripts/generate-branches-csv.mjs` | Regenerate sample branch CSV |
