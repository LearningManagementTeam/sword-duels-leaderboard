import type { Metadata } from "next";
import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { SdPublicAreaStatus } from "@/components/sword-duels/SdPublicAreaStatus";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import {
  getSdPublicAreaSummary,
  resolveAreaChampionDisplayName,
} from "@/lib/products/sword-duels/public-area-summary";
import { loadPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import { getSdPublicOverview } from "@/lib/products/sword-duels/public-queries";
import {
  buildSdPageMetadata,
  journeyShareCopy,
} from "@/lib/products/sword-duels/share-metadata";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const journey = await loadPublicJourneyState().catch(() => null);
  const copy = journeyShareCopy(journey);
  return buildSdPageMetadata({
    ...copy,
    path: SWORD_DUELS_PUBLIC,
  });
}

export default async function SwordDuelsHomePage() {
  const configured = isSupabaseConfigured();
  const [data, journey] = await Promise.all([
    configured ? getSdPublicOverview() : Promise.resolve(null),
    configured
      ? loadPublicJourneyState().catch(() => null)
      : Promise.resolve(null),
  ]);
  const shareCopy = journeyShareCopy(journey);
  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Sword Duels</h1>
        <p>
          Two group battles per area earn Spot 1 and Spot 2. Those spot holders
          fight for one area representative.
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
            const championName = resolveAreaChampionDisplayName(
              areaSets,
              data.scoreMap,
              b
            );
            const summary = getSdPublicAreaSummary(areaSets, championName);

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
                <SdPublicAreaStatus
                  label={summary.label}
                  phase={summary.phase}
                  championName={summary.championName}
                />
              </Link>
            );
          })}
        </div>
      )}

      <SwordDuelsPublicFooter
        sharePath={SWORD_DUELS_PUBLIC}
        shareTitle={`Share — ${shareCopy.title}`}
        shareDescription={shareCopy.description}
      />
    </div>
  );
}
