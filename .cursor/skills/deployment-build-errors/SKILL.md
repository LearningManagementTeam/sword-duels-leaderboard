---
name: deployment-build-errors
description: >-
  Diagnose and fix Vercel/CI npm run build failures (TypeScript, Next.js, missing
  imports). Use when deployment fails, build exits with 1, user pastes Vercel
  logs, or before merging features that touch server actions.
---

# Deployment & build error handling

## Golden rule

**Always run `npm run build` locally before considering a feature done.** Dev mode (`npm run dev`) does not run full TypeScript checking the same way production build does.

```bash
npm run build
```

Optional: `npm test` for unit tests.

---

## Triage workflow

When the user reports a deployment failure:

1. **Read the first TypeScript error** — Vercel often stops at the first failure; fix that, rebuild, repeat.
2. **Identify the file and line** from the log (e.g. `src/lib/actions/sword-duels-admin.ts:7`).
3. **Classify the error** (see table below).
4. **Fix minimally** — do not refactor unrelated code while unblocking deploy.
5. **Run `npm run build` again** until exit code 0.
6. **Tell the user** what broke, what you fixed, and that they can redeploy.

---

## Common error patterns (this repo)

| Error message | Likely cause | Fix |
|---------------|--------------|-----|
| `Cannot find name 'X'` | Missing import or typo after edit/merge | Add `import { X } from "..."` or restore deleted import block |
| `Cannot find module '@/...'` | Wrong path or file not committed | Verify file exists; check `tsconfig` paths |
| `Type 'X' is not assignable` | Server action return type vs form action | Wrap in `void` helper or change return type |
| `X is possibly 'undefined'` | Strict null checks | Optional chaining or early return |
| `useSearchParams()` without Suspense | Next.js static generation | Wrap client subtree in `<Suspense>` |
| Route conflict | Two pages same URL | Remove duplicate route group page |

### Missing imports (most common after agent edits)

Agent refactors often **consolidate or delete import lines** while leaving usages. Symptoms:

```
Type error: Cannot find name 'requireAdminEmail'.
Type error: Cannot find name 'createServiceClient'.
```

**Fix:** Open the file, list every identifier used, verify each has an import at the top. Compare with a sibling file (e.g. `admin.ts` for server-action patterns).

**Server action import checklist** for `src/lib/actions/*.ts`:

```typescript
import { requireAdminEmail } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
```

---

## Pre-deploy checklist (agent)

Before finishing multi-file work:

- [ ] `npm run build` passes (exit 0)
- [ ] No duplicate routes under `(hub)` vs product route groups
- [ ] New server actions have all imports
- [ ] Form `action={fn}` handlers return `Promise<void>` if needed
- [ ] New env vars documented (user adds in Vercel — never commit secrets)

---

## Communicating with the user

When deployment fails:

1. State **what failed** in plain language (e.g. "a missing import in the Sword Duels admin actions file").
2. State **what you changed** (one sentence).
3. Confirm **build passes locally** after the fix.
4. Ask them to **redeploy** or push if they use Git-triggered Vercel deploys.

Do not blame the user. Do not skip running build after claiming a fix.

---

## Vercel-specific notes

- Build command: `npm run build` (see `package.json`).
- TypeScript runs during `next build` — errors block deploy even if dev server worked.
- If build passes locally but fails on Vercel: check Node version, env vars, and that all new files are committed.

---

## Related skills

- **sword-duels-leaderboard** — deploy env vars and Supabase setup
- **sword-duels-admin** — server action patterns and auth
