import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { SdGroupSortSettings } from "@/components/sword-duels/SdGroupSortSettings";
import { swordDuelsPath, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
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
  if (event) {
    try {
      const dash = await getSdDashboard(event.id);
      areas = dash.areas;
    } catch {
      areas = [];
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

      {!configured && <SetupBanner />}

      {configured && event && (
        <SdGroupSortSettings currentMode={event.group_sort_mode ?? "branch_code"} />
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
                <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                  <span
                    className={
                      a.groupAPublished
                        ? "text-emerald-300"
                        : "text-sd-muted/60"
                    }
                  >
                    Grp A {a.groupAPublished ? "✓" : "—"}
                  </span>
                  <span
                    className={
                      a.groupBPublished
                        ? "text-emerald-300"
                        : "text-sd-muted/60"
                    }
                  >
                    Grp B {a.groupBPublished ? "✓" : "—"}
                  </span>
                  <span
                    className={
                      a.finalPublished ? "text-amber-300" : "text-sd-muted/60"
                    }
                  >
                    Final {a.finalPublished ? "✓" : "—"}
                  </span>
                  {a.areaChampionName && (
                    <span className="text-sd-gold">Rep: {a.areaChampionName}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
