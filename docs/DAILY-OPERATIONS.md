# Daily operations — central admin team

No technical steps. Use any laptop with internet and your admin bookmark.

## Admin pages (quick map)

| Page | Use for |
|------|---------|
| **Dashboard** | Workflow cards — weekly round, extra advancement, end of phase |
| **Rounds** | Enter and publish scores |
| **Mechanics** | Edit public “How it works” intro and announcements (rule tables auto-update) |
| **Competition map** | Set “you are here” on the home page journey + caption |
| **Branding** | Hero logo, home photo carousel (3 slots), header icon |
| **System & stack** | Tech setup, migrations, architecture (IT / troubleshooting) |

Public mechanics: **How it works** on the site header → `/mechanics`

The public site and admin panel share the same **neon glass** look (green + magenta accents) with a built-in animated AR-style background on every page.

## Competition map (home)

After each major beat (round published, phase transition, finals week):

1. Admin → **Competition map**
2. Pick the **milestone** that matches where the event is (e.g. June Round 2, July → August transition).
3. Set **region highlight** (all regions or one) and write a short **public caption** (“You are here: …”).
4. Save. The home page shows the journey map and a **remaining contestants** list from live standings (updates when you publish scores — no need to re-save the map for list counts).

Optional: **Suggest from latest June round** pre-fills milestone and caption; review before saving.

## Home photo carousel

1. Admin → **Branding** → **Home photo carousel**
2. Upload up to **3** photos (slots 1–3). JPG, PNG, or WebP, max **3 MB** each; **1920×1080** landscape recommended.
3. The home page shows **one** carousel that rotates through uploaded photos. Leave a slot empty if you want fewer than three.

## Logo (one-time or when it changes)

1. Admin → **Branding**
2. Upload PNG, JPG, WebP, or SVG (max 2MB)
3. Logo appears as the large **hero splash** on home and leaderboards (almost full phone width), plus a small icon in the header. PNG/SVG with transparent background works best on the dark glass UI.

## Before June (one-time)

1. Admin → **Branches**
2. **Download combined template** → fill branch + optional representative columns in Excel → **CSV UTF-8**
3. **Upload** → **Import for June Round 1**
4. Or edit names later: **Representatives** → table → **Save all**
5. Admin → **Rounds** → **June — Round 1** → enter scores → publish

## Weekly rounds (June & July) — elimination flow

Each round is one week. **That round’s score only** decides who advances (not cumulative).

### June survivor counts (per region)

| After round | Luzon / NCR / VisMin each | Total |
|-------------|---------------------------|-------|
| Round 1 | 32 | 96 |
| Round 2 | 16 | 48 |
| Round 3 | 8 | **24 → July** |

### July survivor counts (per region)

| After round | Per region | Total |
|-------------|------------|-------|
| Round 1 | 4 | 12 |
| Round 2 | 2 | 6 |
| Round 3 | 1 | **3 → August** |

### Every round

1. Open **Admin** → **Rounds** → correct round (e.g. June — Round 2).
2. Enter **Points** for **survivors only** (eliminated branches are hidden; see read-only list if needed).
3. **Round 1 quiz caps:** June R1 = **0–10** points · July R1 = **0–15** points (points only — no wins/losses).
4. After publish, branches **tied at the cut** show **Tie breaker** on the public board — run tie-breaker round, then use **advancement picks** to add winners.
5. **Save draft** while checking → public site unchanged.
6. Optional: **Preview standings (draft)**.
7. **Save & publish** when correct.
8. Public site → pick **June or July** → pick **region** (Luzon / NCR / VisMin).
9. Confirm badges: **Advancing to R2** / **Tie breaker — R1** / **Eliminated — R1**, and **—** for rounds not played.

### Many ties at 10/10 (or max score)?

After you **publish** a round, if more branches deserve to advance than the automatic cut (e.g. 35 branches scored **10/10** in Luzon but only **32** advance):

1. **Admin** → **Rounds** → that round → **Manage advancement picks** (link also on the rounds list after publish).
2. Open the **region** tab (Luzon / NCR / VisMin).
3. Review **Auto-advanced** (read-only) and check extra branches under **Also advance to Round 2** (or next round).
4. Use **Show only max score** to focus on perfect scores.
5. **Save picks for [region]** — repeat for other regions if needed.
6. Check the public regional board: extras show **Advancing to R*n* (committee pick)** and appear in the next round’s score form.

You do **not** need to change the global 32/16/8 caps or enter fake point values.

## Do not

- Share the admin URL on mass chat (only central team).
- Publish until all **eligible** branches for that round are entered.
- Run **Lock & advance** until Round 3 is published for the phase.

## End of June

1. Publish **June — Round 3**.
2. Check each regional **June** page — 8 survivors per region (24 total).
3. Admin → **Advancement** → **Lock & advance** for **June**.
4. July Round 1 shows only those 24 branches.

## End of July

1. Publish **July — Round 3** for all regions.
2. Check each regional page — 1 champion per region.
3. **Lock & advance** for **July**.
4. August shows three regional champions.

## TV at an event

Open e.g. `https://YOUR-SITE/tv?phase=june&region=luzon` (switch region tabs on screen). Fullscreen (F11).

## Preview leaderboards (sample data)

| Page | URL |
|------|-----|
| Preview hub | `/preview` |
| June by region | `/preview/june/luzon`, `/ncr`, `/vismin` |
| July by region | `/preview/july/luzon`, etc. |
| August sample | `/preview/august` |
| TV preview | `/preview/tv?phase=june&region=luzon` |
| Admin links | Admin → **Preview** |

## If something looks wrong

1. Note the round and branch name.
2. Fix scores in Admin → re-publish that round (elimination recalculates automatically).
3. If access issues → contact whoever set up Supabase admin.

## Database note (one-time)

If upgrading an existing Supabase project, run in SQL Editor:

- `supabase/migrations/004_round_elimination.sql`
- `supabase/migrations/005_manual_round_advances.sql` (committee extra advancement picks)
- `supabase/migrations/006_site_content.sql` (editable public mechanics page)
- `supabase/migrations/007_branding_storage.sql` (logo storage bucket + branding settings)
- `supabase/migrations/008_tie_breaker_status.sql` (tie breaker status + column)
