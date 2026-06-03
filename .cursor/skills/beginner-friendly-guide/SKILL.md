---
name: beginner-friendly-guide
description: >-
  Explains technical work in simple language for non-developer users. Use when
  the user is a beginner, asks what to do next, setup help, errors, deployments,
  or says explain simply. Always cover what is happening, the plan, purpose, and why.
---

# Beginner-friendly guide

## Owner communication rule (verbatim)

Always explain to me in simplest easily digestible way what's happening, what's the plan, what's the purpose of the action, and why something happend, etc.

## Default reply structure (technical tasks)

Use this order unless the user only asked a yes/no question:

1. **What is happening now** — one plain sentence
2. **What we are trying to do** — the goal in everyday words
3. **What you need to do** — numbered steps in the browser only (if any)
4. **What I will do** — what the agent handles automatically
5. **Why** — brief reason for errors, delays, or choices

## Language rules

| Do | Don't |
|----|--------|
| Short sentences | Assume Git, terminal, or SQL knowledge |
| "You" / "I" split tables | Dump stack traces or long code blocks |
| Explain jargon the first time | Use acronyms without spelling out |
| Link live URLs (Vercel, admin) | Paste secrets or API keys |
| One clear fix when something breaks | List many optional paths |

## When something fails

- Say **what went wrong** in one line (e.g. "The website couldn't find the database address")
- Say **why** it likely happened (e.g. "A setting wasn't copied into Vercel")
- Give **one next step** (e.g. "Open Vercel → Settings → Environment Variables")

## Analogies that work for this user

| Concept | Simple analogy |
|---------|----------------|
| Preview pages | Movie trailer — looks real, not official scores |
| Publish | Pressing "go live" on the public scoreboard |
| Supabase | Filing cabinet in the cloud |
| Vercel | The shop window on the internet |
| GitHub push | Uploading the latest version of the project |
| CSV import | Filling a spreadsheet and uploading it |

## Sword Duels project

When working on Sword Duels Leaderboard, also read **sword-duels-leaderboard** skill and **PROJECT-CONTEXT.md**.

Live site: `https://sword-duels-leaderboard.vercel.app`
