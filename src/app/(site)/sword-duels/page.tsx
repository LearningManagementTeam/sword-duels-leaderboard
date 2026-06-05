import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import { getSdPublicOverview } from "@/lib/products/sword-duels/public-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

export const revalidate = 30;

export const metadata = {
  title: "Sword Duels — Area tournaments",
};

export default async function SwordDuelsHomePage() {
  const configured = isSupabaseConfigured();
  const data = configured ? await getSdPublicOverview() : null;

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Sword Duels</h1>
        <p>
          Two group battles per area earn Spot 1 and Spot 2. Those spot holders
          fight for one area representative.
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href={`${SWORD_DUELS_PUBLIC}/mechanics`} className="sd-link text-sm">
            How area tournaments work →
          </Link>
          {data && data.brackets.length > 0 && (
            <Link href={`${SWORD_DUELS_PUBLIC}/tv`} className="sd-link text-sm">
              TV bracket view →
            </Link>
          )}
        </p>
      </div>

      {!configured && <SetupBanner />}

      {!data || data.brackets.length === 0 ? (
        <p className="text-sm text-sd-muted">
          Tournament brackets will appear here once branches are synced by the
          admin team.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.brackets.map((b) => {
            const areaSets = data.sets.filter((s) => s.area === b.area);
            const final = areaSets.find((s) => s.set_type === "area_final");
            const champId = final?.winner_branch_id;
            const champ = champId
              ? [...b.groupA, ...b.groupB].find((x) => x.branch_id === champId)
              : null;

            return (
              <Link
                key={b.area}
                href={`${SWORD_DUELS_PUBLIC}/${areaSlug(b.area)}`}
                className="sd-neon-panel block p-5 transition hover:ring-1 hover:ring-cyan-400/30"
              >
                <h2 className="text-lg font-semibold text-white">{b.area}</h2>
                <p className="mt-1 text-sm text-sd-muted">
                  {REGION_LABELS[b.region as Region]} · {b.branchCount} branches
                </p>
                {champ ? (
                  <p className="mt-2 text-sm text-sd-gold">
                    Area rep: {champ.branch_name}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-sd-muted/70">In progress</p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      <SwordDuelsPublicFooter
        sharePath={SWORD_DUELS_PUBLIC}
        shareTitle="Share Sword Duels standings"
      />
    </div>
  );
}
