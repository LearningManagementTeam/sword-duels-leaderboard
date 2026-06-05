# Sword Duels — Area tournament mechanics

This document defines the **Sword Duels** area group tournament (separate from **National Competitions** June → July → Nationals).

Implementation: [`src/lib/products/sword-duels/`](../src/lib/products/sword-duels/)

## Goal

Each **area** selects **one area representative** through a three-set bracket.

## How branches are grouped

Branches are loaded from the master roster (CSV / admin import). Each branch has an `area` field.

Within one area, branches are **sorted by branch code** and split in half:

| Group | Branches |
|-------|----------|
| **Group A** | First half (e.g. branches 1–5 when 10 in the area) |
| **Group B** | Second half (e.g. branches 6–10) |

Example — **Area 1** with 10 branches:

- **Set 1 (Group A):** Branch 1, 2, 3, 4, 5 compete for **Spot 1**
- **Set 2 (Group B):** Branch 6, 7, 8, 9, 10 compete for **Spot 2**
- **Area final:** Spot 1 vs Spot 2 → **1 area representative**

## Representatives

- Admin enters **two representatives per branch** (name, employee no., position) before battles.
- **Bulk import:** Admin → Sword Duels → Representatives → **Download CSV template**, fill names in Excel, upload or paste, then **Import**.
- Required CSV columns: `branch_code`, `representative_1`.
- Optional CSV columns: `representative_1_employee_no`, `representative_1_position`, `representative_2`, `representative_2_employee_no`, `representative_2_position`, `branch_name`, `area`.
- Representative names appear on the public tournament map and leaderboard.
- Battles are scored **per branch**; the winning branch earns the spot.

## How winners are decided

### High score (quiz-style)

All branches in the group compete in one set. **Highest score wins** the group spot.

Tie-breaker: higher points, then branch code (A–Z).

### Best 2 survivors (survival-style)

Track **hearts remaining** and **eliminated** status per branch.

1. Non-eliminated branches with hearts remaining are ranked.
2. The **top 2 survivors** are identified.
3. The spot goes to the **higher scorer among those two**.

## Publish flow

1. **Sync brackets** — rebuild groups from the branch roster.
2. **Enter representatives** — two names per branch.
3. **Score Set 1 (Group A)** → **Publish** → Spot 1 locked on the map.
4. **Score Set 2 (Group B)** → **Publish** → Spot 2 locked on the map.
5. **Score area final** → **Publish** → area representative crowned.

Draft scores are admin-only. The public map and leaderboard update only after **Publish**.

## Tournament map

The map advances dynamically:

```
Group A field → Spot 1 ──┐
                         ├── Area final → Area representative
Group B field → Spot 2 ──┘
```

Eliminated branches are greyed out after a set is published. Spot holders advance to the area final column when both group sets are published.

## Admin & public URLs

| Surface | URL |
|---------|-----|
| Admin dashboard | `/admin/sword-duels` |
| Score an area | `/admin/sword-duels/areas/[area]` |
| Public hub | `/sword-duels` |
| Public area map | `/sword-duels/[area]` |

National Competitions (`/june`, `/july`, `/august`) uses a different ruleset and is not affected.
