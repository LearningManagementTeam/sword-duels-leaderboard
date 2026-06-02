# Sword Duels Leaderboard — Setup guide (no coding required)

This guide lists **only the steps you must do yourself** in a browser. Your Cursor agent can handle code, Git, and technical fixes when you ask.

**Time needed:** about 45–60 minutes the first time.

---

## What you are building

| Piece | What it is | Who uses it |
|-------|------------|-------------|
| **Public website** | Leaderboard on the internet | All branches (no login) |
| **Admin page** | Secret page to enter scores | Your central team only |
| **Database (Supabase)** | Stores branches and scores | Hidden behind the website |

You will create **two free accounts**: Supabase (database) and Vercel (website).

---

## Before you start — gather this

- [ ] Work email (for Supabase and Vercel sign-up)
- [ ] A **strong password** you will use for **admin login** (write it in a safe place — password manager or secure note)
- [ ] Your official **branch list** in Excel (optional on day 1; sample data is included)
- [ ] Optional: company credit card — **not required** on free tiers

---

## Part 1 — Supabase (database) — YOU do this

### Step 1.1 — Create account and project

1. Open [https://supabase.com](https://supabase.com) in Chrome or Edge.
2. Click **Start your project** → sign up with email or Google.
3. Click **New project**.
4. Fill in:
   - **Name:** `Sword Duels` (any name is fine)
   - **Database password:** create a long password → **save it** in your password manager (you rarely need it again)
   - **Region:** choose closest to Philippines (e.g. Singapore) if available
5. Click **Create new project** and wait 2–3 minutes until the dashboard loads.

### Step 1.2 — Run the database setup (one copy-paste)

1. In the left menu, click **SQL Editor**.
2. Click **New query**.
3. On your computer, open this file in the project folder:  
   `supabase/ALL-IN-ONE-MIGRATION.sql`
4. Select **all** text (Cmd+A / Ctrl+A), **Copy**.
5. Paste into the Supabase SQL box.
6. Click **Run** (bottom right).
7. You should see **Success**. If you see red errors and you already ran it before, tell your Cursor agent.

### Step 1.3 — Copy three secret keys (keep private)

1. Left menu → **Project Settings** (gear icon) → **API**.
2. Copy and save in a **private note** (not Slack public channels):

| Label on screen | Where you will use it later |
|-----------------|----------------------------|
| **Project URL** | Vercel — `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** key | Vercel — `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** key | Vercel — `SUPABASE_SERVICE_ROLE_KEY` |

**Important:** Never share the **service_role** key publicly. Only paste it into Vercel’s secret settings.

### Step 1.4 — Create your admin login

1. Left menu → **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. Enter **your work email** and a **password** (this is what you use at `/admin/login`).
4. Click **Create user**.

### Step 1.5 — Allow that user to access Admin

1. Go back to **SQL Editor** → **New query**.
2. Copy this block, **replace** the email with yours, paste, **Run**:

```sql
INSERT INTO admins (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'YOUR-EMAIL@company.com';
```

3. You should see **Success** (or “1 row” inserted).

**Checkpoint:** You have Supabase URL + 2 keys + admin email/password.

---

## Part 2 — Put the website online (Vercel) — YOU do this

You need the project on **GitHub** first. Pick **one** path:

### Path A — Ask Cursor (easiest if you use Cursor)

Tell the agent:

> “Push this Sword Duels Leaderboard project to a new GitHub repo and tell me the repo URL.”

You may need to sign in to GitHub when the browser opens. Approve access.

### Path B — GitHub website (no terminal)

1. Go to [https://github.com](https://github.com) → sign up / log in.
2. Click **+** → **New repository**.
3. Name: `sword-duels-leaderboard` → **Create repository**.
4. Follow GitHub’s “upload files” instructions to upload your project folder, **except** do not upload the `node_modules` or `.next` folders (skip those — they are huge).

### Path C — GitHub Desktop

1. Install [GitHub Desktop](https://desktop.github.com/).
2. **File → Add local repository** → choose your `Sword Duels Leaderboard` folder.
3. **Publish repository** to your GitHub account.

---

### Step 2.1 — Deploy on Vercel

1. Open [https://vercel.com](https://vercel.com) → sign up (use **Continue with GitHub**).
2. Click **Add New…** → **Project**.
3. **Import** your `sword-duels-leaderboard` repository.
4. On the configure screen, open **Environment Variables** and add **three** rows:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Paste Project URL from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Paste anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Paste service_role key |

5. Click **Deploy** and wait until status is **Ready** (green).
6. Click the visit link — you should see **Sword Duels** home page.

**Your public website address** looks like:  
`https://sword-duels-leaderboard-xxxxx.vercel.app`  
Save this link — you will share it with branches.

### Step 2.2 — Bookmarks for your team

| Bookmark | URL |
|----------|-----|
| Public leaderboard | `https://YOUR-VERCEL-URL/` |
| Admin (secret) | `https://YOUR-VERCEL-URL/admin/login` |
| TV mode (events) | `https://YOUR-VERCEL-URL/tv?phase=june` |

---

## Part 3 — First-time data setup — YOU do this

1. Open **Admin** URL → sign in with the email/password from Step 1.4.
2. Click **Branches** → **Import branches from CSV**  
   - First time: imports sample branches from the project.  
   - Later: replace `data/branches.csv` with your real list (ask agent to help update the file), then import again.
3. Open **Rounds** → pick **June — Round 1** → enter a few test scores → **Save & publish**.
4. Open your **public** site → **June** — you should see the test standings.
5. Delete test scores later or ask the agent before go-live.

**Checkpoint:** Public page shows data after you publish.

---

## Part 4 — During the competition — YOU do this

See [DAILY-OPERATIONS.md](./DAILY-OPERATIONS.md) for round-by-round habits.

Short version:

1. Enter all scores for a round → **Save draft** until complete.
2. When correct → **Save & publish**.
3. Share the **public** link (not the admin link).
4. After June ends → **Advancement** → **Lock & advance** for June.
5. Repeat for July and August.

---

## What only YOU can do (agent cannot)

| Task | Why |
|------|-----|
| Create Supabase / Vercel / GitHub accounts | Needs your identity and billing acceptance |
| Copy API keys into Vercel | Secrets tied to your projects |
| Create admin user + run SQL with **your** email | Security |
| Decide official branch list and competition scores | Business data |
| Share public URL with branches | Your communication |
| Pay for upgrades (if you outgrow free tier) | Your organization |

## What to ask Cursor to automate

- Fix errors after deploy
- Update branch CSV from Excel
- Change scoring rules when mechanics are final
- Custom domain setup (DNS steps — you still click DNS at your registrar)
- Add more admin users (agent gives you SQL; you run it in Supabase like Step 1.5)

---

## Troubleshooting (simple)

| Problem | What to try |
|---------|-------------|
| Admin says “Not an admin” | Repeat Step 1.5 with correct email |
| Public page empty | Publish a round (Part 3); wait 1 minute; refresh |
| “Setup required” banner | Vercel env vars missing or wrong — recheck Step 2.1 |
| Forgot admin password | Supabase → Authentication → Users → reset password |

---

## Printable checklist

Use [CHECKLIST.md](./CHECKLIST.md) and tick boxes as you go.

---

## Need help in Cursor?

Say: **“Use the sword-duels-leaderboard skill and help me with [your step].”**

The agent will know this project’s layout and what you should do vs what it can run for you.
