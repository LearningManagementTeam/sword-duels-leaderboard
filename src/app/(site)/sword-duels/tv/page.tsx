import Link from "next/link";
import { redirect } from "next/navigation";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { SdTvAreaRotator } from "@/components/sword-duels/SdTvAreaRotator";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import {
  filterPublicScores,
  getSdPublicArea,
  getSdPublicOverview,
} from "@/lib/products/sword-duels/public-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const revalidate = 30;

export const metadata = {
  title: "Sword Duels — TV bracket",
};

export default async function SwordDuelsTvPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; rotate?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    redirect(SWORD_DUELS_PUBLIC);
  }

  const { area: areaParam, rotate } = await searchParams;
  const rotateSec = parseInt(rotate ?? "0", 10);
  const overview = await getSdPublicOverview();

  if (!overview || overview.brackets.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <ArBackdrop />
        <p className="relative text-sd-muted">
          No brackets yet.{" "}
          <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
            Back to Sword Duels
          </Link>
        </p>
      </div>
    );
  }

  const areas = overview.brackets.map((b) => b.area);
  const currentArea = areaParam && areas.includes(areaParam) ? areaParam : areas[0];
  const ctx = await getSdPublicArea(currentArea);

  if (!ctx) {
    redirect(SWORD_DUELS_PUBLIC);
  }

  const { bracket, sets, scoreMap } = ctx;
  const publicScores = filterPublicScores(sets, scoreMap);

  return (
    <div className="fixed inset-0 z-50 overflow-auto p-4 sm:p-6">
      <ArBackdrop />
      <div className="relative mx-auto max-w-7xl">
        <SdTvAreaRotator
          areas={areas}
          currentArea={currentArea}
          rotateSec={rotateSec}
        />
        <AreaTournamentMap
          bracket={bracket}
          sets={sets}
          scoresBySetId={publicScores}
          tvMode
          fullscreen
        />
      </div>
    </div>
  );
}
