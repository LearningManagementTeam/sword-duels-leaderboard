# System build journal (plain language)

This is a **day-by-day story** of what we built on the Sword Duels Leaderboard website, written for committee members and operators — not developers.

**Live site:** https://sword-duels-leaderboard.vercel.app  
**Started:** 2 June 2026

For *how to run events today*, use [DAILY-OPERATIONS.md](./DAILY-OPERATIONS.md) (National Competitions) and [SD-DAILY-OPERATIONS.md](./SD-DAILY-OPERATIONS.md) (Sword Duels).

---

## How to read this

| Term | Meaning |
|------|---------|
| **National Competitions (NC)** | The June → July → August branch leaderboard (135 branches, 3 rounds per phase) |
| **Sword Duels (SD)** | The separate area tournament program (group battles → area rep → nationals wild card → knockout) |
| **Admin** | The password-protected back office at `/admin` |
| **Publish** | Makes scores visible on the public site (draft scores stay hidden) |
| **Migration** | A one-time database update run in Supabase (often needed after new features) |

---

## 2 June 2026 — Foundation day

**What we did:** Turned a blank website into a working leaderboard system connected to a cloud database (Supabase) and put it online (Vercel).

| What we built | What it does for you |
|---------------|----------------------|
| **Public leaderboard pages** | Visitors can see June, July, and August standings by region |
| **Admin login** | Only approved committee emails can change scores |
| **Database for branches, seasons, rounds, scores** | One central place for all competition data |
| **CSV import for branches** | Upload a spreadsheet of all ~135 branches instead of typing each one |
| **Representatives admin page** | Edit competitor names branch by branch (or include them in the CSV) |
| **Combined participants CSV** | One file can carry branch info *and* representative names together |
| **Setup guides & default admin docs** | Written instructions for first-time setup |
| **Safer CSV import** | Branch names with commas in them no longer break the upload |
| **Deploy fixes** | Site still builds even if database settings are missing during setup |

**In one sentence:** The core “upload branches → enter round scores → public sees standings” loop existed by end of day.

---

## 3 June 2026 — Public experience & site polish

**What we did:** Made the public site feel like a real event hub, added preview/demo modes, and expanded what admins can edit without code.

| What we built | What it does for you |
|---------------|----------------------|
| **Preview / demo leaderboards** | Try the look of boards with sample data before going live (`/preview`) |
| **TV-style full-screen view** | Big readable display for projectors or event screens (`/tv`) |
| **Share card on home** | QR code and link so branches can bookmark the site easily |
| **Home “live ranks” preview** | Home page shows a snapshot of current leaders, not just a menu |
| **Competition map on home** | Visual “you are here” journey through June → July → Nationals |
| **Collapsible season journey** | Visitors can expand the full path-to-crown map when they want detail |
| **Branding admin** | Upload logo, rotating home photos (carousel), partner logo strip |
| **Mechanics page editor** | Change the public “How it works” text from admin |
| **Competition map editor** | Set milestone, caption, and region highlight on the home journey |
| **Draft standings preview (admin)** | See what the table will look like *before* publishing scores |
| **Gamified leaderboard styling** | Rankings feel more energetic (badges, motion, neon glass look) |
| **Unified branch + rep CSV** | Single import path for roster setup |
| **Operator daily-ops doc (first version)** | Written checklist for weekly round work |

**In one sentence:** The site started to look and feel like a branded competition product, not just a spreadsheet on the web.

---

## 4 June 2026 — Admin comfort & scoring tools

**What we did:** Made the admin panel easier for event-week stress — clearer navigation, confirmations, and faster score entry.

| What we built | What it does for you |
|---------------|----------------------|
| **Grouped admin navigation** | Pages grouped as Operate / Roster / Site / Tools |
| **Workflow cards on dashboard** | “What should I do this week?” cards on the home admin screen |
| **Phase status strip** | See at a glance which month (June / July / August) is active |
| **Recent rounds list** | Quick jump back into the last rounds you edited |
| **Confirm panels** | “Are you sure?” dialogs before destructive actions (clear scores, publish, lock phase) |
| **Post-publish checklist** | Reminds you what to check after scores go live |
| **Score paste panel** | Paste a column of numbers from Excel instead of clicking every cell |
| **Import guard on branch CSV** | Warns if you re-import branches after scores were already published |
| **Branding section tabs** | Logo, carousel, and partner logos organized in one place |
| **Export standings panel** | Download CSV snapshots for records or sharing |
| **Admin skills & journey audit notes** | Internal guides so future changes stay consistent |

**In one sentence:** Committee operators got safer, faster tools for the repetitive work of each round.

---

## 5 June 2026 — Two programs & Sword Duels launch

**What we did:** Split admin into **National Competitions** and **Sword Duels**, built the full Sword Duels area bracket experience, and wired representatives into both programs.

| What we built | What it does for you |
|---------------|----------------------|
| **Admin hub with two products** | `/admin` lets you pick NC vs Sword Duels instead of one crowded menu |
| **Sword Duels public hub** | `/sword-duels` — map of all areas and tournament status |
| **Per-area bracket pages** | `/sword-duels/[area]` — live bracket, group standings, area final |
| **Area scoring admin** | Publish Group A, Group B, then area final per area |
| **Tournament map visuals** | Bracket graphics, pedestals, mobile journey, TV rotator |
| **Group sort settings** | Control how branches are ordered in groups (e.g. by branch code) |
| **SD representatives import** | CSV to set two reps per branch for Sword Duels |
| **Employee no. & position on slots** | Rep metadata can show on bracket cards |
| **Roster capacity preview** | Sanity-check survivor counts against rules before locking phases |
| **SD mechanics page** | Public rules for Sword Duels (`/sword-duels/mechanics`) |
| **Database: Sword Duels tables** | Areas, sets, scores stored properly (migration 016) |

**In one sentence:** Sword Duels became a full second competition on the same site, sharing the branch list from National Competitions.

---

## 6 June 2026 — Nationals, home page, schedules

**What we did:** Finished nationals (wild card + knockout), improved navigation, let you choose which program is featured on the home page, and added event calendars.

### Morning — Nationals production

| What we built | What it does for you |
|---------------|----------------------|
| **Wild card round (database + admin)** | When all area finals are in, slot 16 is decided (migration 019) |
| **Wild card public map** | Purple-themed map showing who might take the last nationals spot |
| **Wild card admin scoring** | Enter tiebreak scores and publish the wild card winner |
| **Knockout bracket (database + admin)** | Full area-vs-area knockout through the final (migration 020) |
| **Knockout public map** | Gold-themed battle path to national champion |
| **Knockout admin** | Score and publish each knockout match; bracket advances automatically |
| **Nationals TV mode** | `/sword-duels/tv?mode=nationals` for event night displays |
| **SD daily operations doc** | Step-by-step for area → wild card → knockout |
| **Ecosystem audit & fixes** | Journey bar, sub-navigation, breadcrumbs, share text, unpublish warnings |

### Afternoon — Home page & schedules

| What we built | What it does for you |
|---------------|----------------------|
| **Featured program choice** | Home hero can spotlight Sword Duels or National Competitions (migration 021) |
| **Site home admin** | Admin → NC → Site home: pick featured program, optional headline overrides |
| **Event schedule on home** | “Upcoming” and “Recent results” columns on the home page (migration 022) |
| **Manual event schedule editor** | Add planned announcement dates; past rows auto-remove on save |
| **Per-area SD battle dates** | Schedule Group A / B / area final per area (migration 023) |
| **SD schedules admin + CSV import** | Bulk upload area dates; shows on home Upcoming and each area page |
| **NC phase round dates** | June/July/Nationals round dates on home until published (migration 024) |
| **Journey bar on home (when SD featured)** | Progress bar for how many area reps are crowned |
| **Public nav: Sword Duels link** | Easier to find Sword Duels from any page |
| **Wildcard unpublish confirm** | Extra safety before undoing wild card (warns about knockout reset) |
| **Home page crash fix** | Fixed date formatting that caused the whole home page to error |

**In one sentence:** The system now covers the full Sword Duels season arc on the public site, and the home page can act as a control room for both programs.

---

## What exists today for branch management

| Capability | Where | Notes |
|------------|-------|-------|
| **Add / edit / deactivate branches** | Admin → National Competitions → **Branches** → Branch roster table | Search, edit row, deactivate (soft hide) or reactivate |
| **Bulk add/update branches** | Same page → CSV import | Updates by branch code; re-activates imported rows |
| **Edit representative names** | Admin → **Representatives** (NC or SD) | Active branches only |
| **SD reads NC branch list** | Sword Duels dashboard | Sync brackets after branch import (active branches only) |

Deactivated branches keep past scores; they drop out of imports, home branch counts, and Sword Duels bracket sync.

---

## Database migrations checklist (operator / IT)

Run in Supabase SQL Editor if not already applied:

| Migration | Purpose |
|-----------|---------|
| 001–015 | Core NC schema, branding, elimination, manual advances, etc. |
| 016 | Sword Duels area brackets |
| 017 | Representative employee fields |
| 018 | Group sort & active rep |
| 019 | Nationals wild card |
| 020 | Nationals knockout |
| 021 | Featured program on home |
| 022 | Manual event schedule |
| 023 | SD area battle dates |
| 024 | NC phase round dates |
| 025 | Branch `is_active` (soft deactivate) |

---

## Parked / not started

| Topic | Status |
|-------|--------|
| **Lark Base sync** | Discussed only — not connected |
| **Rich OG/social previews when NC is featured on home** | Partial — SD featured has full share metadata |

---

## Keeping this journal updated

When new work ships, add a dated section here (or ask the agent to, using the **system-build-journal** skill). Each entry should answer:

1. **What we did** (features in everyday words)  
2. **What it does for you** (table or bullets)  
3. **One sentence summary**

### Follow-up — branch roster editor

| What we built | What it does for you |
|---------------|----------------------|
| **Branch roster table** | Search, filter, edit code/name/area/region on Admin → Branches |
| **Add one branch** | Form at top; auto-seeds June Round 1 with zero points |
| **Deactivate (not delete)** | Hides branch from imports and SD sync; keeps old scores |
| **Migration 025** | Database flag `is_active` on every branch |

**In one sentence:** You can fix roster mistakes without re-uploading the whole CSV.

Last updated: **6 June 2026**
