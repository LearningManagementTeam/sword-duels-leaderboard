import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { SdGroupSortSettings } from "@/components/sword-duels/SdGroupSortSettings";
import { SdAreaStatusBadge } from "@/components/sword-duels/SdAreaStatusBadge";
import { SdNationalsPhaseStrip } from "@/components/sword-duels/SdNationalsPhaseStrip";
import { swordDuelsPath, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import { getSdDashboard, getSdEvent } from "@/lib/products/sword-duels/queries";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

export const dynamic = "force-dynamic";

export default async function SwordDuelsDashboardPage() {
  const configured = isSupabaseConfigured();
  const event = configured ? await getSdEvent() : null;

  let areas: Awaited<ReturnType<typeof getSdDashboard>>["areas"] = [];
  let nationalsContext: Awaited<ReturnType<typeof getSdNationalsContext>> | null =
    null;

  if (event) {
    try {
      const dash = await getSdDashboard(event.id);
      areas = dash.areas;
    } catch {
      areas = [];
    }
    try {
      nationalsContext = await getSdNationalsContext(event.id);
    } catch {
      nationalsContext = null;
    }
  }

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Sword Duels</h1>
        <p>
          Area group tournaments — branches split into two groups per area. Group
          winners battle for the one area representative spot.
        </p>
      </div>

      <div className="sd-alert-info text-sm">
        <strong className="text-white">Branch import</strong> lives under{" "}
        <Link href="/admin/national-competitions/branches" className="sd-link">
          National Competitions → Branches
        </Link>
        . Score area battles here — not on the June/July/August round editor.
        See{" "}
        <code className="text-xs">docs/SD-DAILY-OPERATIONS.md</code> for the full
        operator sequence.
      </div>

      {!configured && <SetupBanner />}

      {configured && event && (
        <SdGroupSortSettings currentMode={event.group_sort_mode ?? "branch_code"} />
      )}

      {nationalsContext && (
        <SdNationalsPhaseStrip
          model={nationalsContext.model}
          knockoutBracket={nationalsContext.knockoutBracket}
        />
      )}

      {configured && !event && (
        <div className="sd-neon-panel space-y-2 p-4 text-sm text-amber-100">
          <p>
            Sword Duels could not load the event row. If you already ran{" "}
            <code className="text-xs">016_sword_duels.sql</code> and saw
            &quot;type already exists&quot;, the migration is partially applied —
            that is normal.
          </p>
          <p>
            Run{" "}
            <code className="text-xs">016_sword_duels_repair.sql</code> in
            Supabase SQL Editor (safe to re-run), then refresh this page. The{" "}
            <strong className="text-white">Sync from branches</strong> button
            should appear.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={swordDuelsPath("representatives")}
          className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-cyan-400/30"
        >
          <h2 className="font-semibold text-white">Representatives</h2>
          <p className="mt-1 text-sm text-sd-muted">
            Enter two representatives per branch before battles run.
          </p>
        </Link>
        <Link
          href={SWORD_DUELS_PUBLIC}
          className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-cyan-400/30"
        >
          <h2 className="font-semibold text-white">Public leaderboard</h2>
          <p className="mt-1 text-sm text-sd-muted">
            Live tournament maps update as sets are published.
          </p>
        </Link>
        <Link
          href={swordDuelsPath("nationals")}
          className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-fuchsia-400/30"
        >
          <h2 className="font-semibold text-fuchsia-200">Nationals</h2>
          <p className="mt-1 text-sm text-sd-muted">
            Wild card + knockout bracket scoring
          </p>
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Areas</h2>
        {areas.length === 0 ? (
          <p className="text-sm text-sd-muted">
            Sync brackets after branches are imported from National Competitions →
            Branches, or import branches there first.
          </p>
        ) : (
          <div className="grid gap-3">
            {areas.map((a) => (
              <Link
                key={a.area}
                href={swordDuelsPath("areas", areaSlug(a.area))}
                className="sd-neon-panel flex flex-wrap items-center justify-between gap-3 p-4 transition hover:ring-1 hover:ring-cyan-400/25"
              >
                <div>
                  <p className="font-medium text-white">{a.area}</p>
                  <p className="text-xs text-sd-muted">
                    {REGION_LABELS[a.region as Region]} · {a.branchCount}{" "}
                    branches (A:{a.groupACount} / B:{a.groupBCount})
                  </p>
                </div>
                <SdAreaStatusBadge area={a} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
