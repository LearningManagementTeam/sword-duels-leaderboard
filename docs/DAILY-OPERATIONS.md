# Daily operations — central admin team

No technical steps. Use any laptop with internet and your admin bookmark.

## Before June (one-time)

1. Admin → **Branches**
2. **Download combined template** → fill branch + optional representative columns in Excel → **CSV UTF-8**
3. **Upload** → **Import for June Round 1**
4. Or edit names later: **Representatives** → table → **Save all**
5. Admin → **Rounds** → **June — Round 1** → enter scores → publish

## Every round (June, July, August)

1. Open **Admin** → **Rounds**.
2. Open the correct season and round (e.g. June — Round 2).
3. Enter **Points** (main score). Wins/Losses are optional.
4. While still checking numbers → **Save draft** (public site unchanged).
5. Optional: click **Preview standings (draft)** to see what the board would look like before publishing.
6. When everything is correct → **Save & publish**.
7. Open the **public** site → confirm the right phase (June / July / region / August).
8. Optional: click **Export CSV** on the public page for announcements (includes representative names when set).

## Do not

- Share the admin URL on mass chat (only central team).
- Publish until all branches for that round are entered.
- Run **Lock & advance** until the whole phase is finished and final standings are published.

## End of June

1. Publish final June round.
2. Check public **June** page — top 24 look correct.
3. Admin → **Advancement** → **Lock & advance** for **June**.
4. July rounds now only show the 24 survivors.

## End of July

1. Publish final July rounds for Luzon, NCR, VisMin.
2. Check each regional page on the public site.
3. **Lock & advance** for **July**.
4. August shows three regional champions.

## TV at an event

Open: `https://YOUR-SITE/tv?phase=june` (or `july` / `august`) on a browser in fullscreen (F11).

## Preview leaderboards (sample data)

Use **preview** pages to demo the site before real scores exist. They use fake data only — nothing is saved to the database.

| Page | URL |
|------|-----|
| Preview hub | `/preview` |
| June sample | `/preview/june` |
| July by region | `/preview/july/luzon`, `/ncr`, `/vismin` |
| August sample | `/preview/august` |
| TV preview | `/preview/tv?phase=june` |
| Admin links | Admin → **Preview** |

Share the **official** URL from the home page QR card once you are ready to go live.

## If something looks wrong

1. Note the round and branch name.
2. Fix scores in Admin → re-publish that round.
3. If access issues → contact whoever set up Supabase admin (Step 1.5 in setup guide).
