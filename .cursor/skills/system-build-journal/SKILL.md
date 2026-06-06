---
name: system-build-journal
description: >-
  Maintains the plain-language build journal for Sword Duels Leaderboard.
  Use when shipping features, finishing a work session, or when the user asks
  to document what was built, update the system journal, or explain changes
  for non-developers. Writes to docs/SYSTEM-BUILD-JOURNAL.md.
---

# System build journal

## Purpose

Keep **`docs/SYSTEM-BUILD-JOURNAL.md`** current so committee members and non-developers can see **what was built, when, and why it matters** — without reading code or git history.

Pair with **`beginner-friendly-guide`** when explaining the same work in chat.

## When to update

Update the journal when **any** of these happen:

- A feature ships (code merged or deployed)
- A meaningful admin or public workflow changes
- New Supabase migrations are added
- The user asks to "document what we did" or "update the build log"

Do **not** wait for the user to ask if you just finished a multi-step implementation — append the journal as part of wrap-up.

## Audience rules

| Do | Don't |
|----|--------|
| Plain English, short sentences | File paths, function names, or stack jargon unless necessary |
| "What it does for you" tables | Raw commit messages or PR titles |
| Name admin pages as users see them | Assume git or SQL knowledge |
| Note new migrations by number + one-line purpose | Paste secrets or env values |
| One-sentence summary per day/entry | Copy entire code diffs |

## Entry template

Add under the correct date (create the date section if missing). If work spans midnight, use the **deployment or wrap-up date**.

```markdown
## D Month YYYY — Short theme title

**What we did:** One sentence theme.

| What we built | What it does for you |
|---------------|----------------------|
| **Feature name** | Everyday benefit |

**In one sentence:** ...

```

For small same-day follow-ups, add a subsection:

```markdown
### Afternoon — topic

| What we built | What it does for you |
...
```

## Also update when relevant

1. **Migrations table** at the bottom of the journal — add row for new `supabase/migrations/0XX_*.sql`
2. **"What exists today for branch management"** — if roster CRUD changes
3. **"Parked / not started"** — move items out when done; add new parked items
4. **`Last updated:`** line at the file footer — set to today

## Optional cross-links

- Operator how-to: `docs/DAILY-OPERATIONS.md`, `docs/SD-DAILY-OPERATIONS.md`
- Technical context: `.cursor/skills/sword-duels-leaderboard/PROJECT-CONTEXT.md`
- Audit findings: `.cursor/skills/sword-duels-ecosystem-audit/findings-2026-06.md`

Do not duplicate full operator procedures in the journal — link instead.

## Workflow

1. Read the latest sections of `docs/SYSTEM-BUILD-JOURNAL.md` to avoid duplicates
2. Gather facts from: git log (`git log --since=...`), migrations folder, conversation, audit docs
3. Draft the new entry in layman's terms
4. Edit `docs/SYSTEM-BUILD-JOURNAL.md` (append or extend today's date)
5. Tell the user what was documented in one short paragraph

## Quality check

Before finishing, confirm each new row answers: **"So what can the committee do now that they couldn't before?"**
