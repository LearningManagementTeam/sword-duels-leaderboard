import Link from "next/link";
import { redirect } from "next/navigation";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { NationalsKnockoutMap } from "@/components/sword-duels/NationalsKnockoutMap";
import { NationalsWildcardMap } from "@/components/sword-duels/NationalsWildcardMap";
import {
  buildSdTvEventSteps,
  SdTvEventRotator,
} from "@/components/sword-duels/SdTvEventRotator";
import { SdTvAreaRotator } from "@/components/sword-duels/SdTvAreaRotator";
import { SdTvNationalsRotator } from "@/components/sword-duels/SdTvNationalsRotator";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { loadNationalsPublicView } from "@/lib/products/sword-duels/load-nationals-public-view";
import {
  filterPublicScores,
  getSdPublicArea,
  getSdPublicOverview,
} from "@/lib/products/sword-duels/public-queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sword Duels — TV bracket",
};

export default async function SwordDuelsTvPage({
  searchParams,
}: {
  searchParams: Promise<{
    area?: string;
    mode?: string;
    view?: string;
    step?: string;
    rotate?: string;
  }>;
}) {
  if (!isSupabaseConfigured()) {
    redirect(SWORD_DUELS_PUBLIC);
  }

  const params = await searchParams;
  const mode = params.mode ?? "areas";
  const rotateSec = parseInt(params.rotate ?? "0", 10);
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
  const event = await getSdEvent();

  if (mode === "nationals" && event) {
    let nationalsView;
    try {
      nationalsView = await loadNationalsPublicView(event.id);
    } catch {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <ArBackdrop />
          <p className="relative text-sd-muted">
            Nationals tables not ready. Run migrations 019/020.{" "}
            <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
              Back
            </Link>
          </p>
        </div>
      );
    }

    const view =
      params.view === "knockout" ? "knockout" : "wildcard";

    return (
      <div className="fixed inset-0 z-50 overflow-auto p-4 sm:p-6">
        <ArBackdrop />
        <div className="relative mx-auto max-w-7xl">
          <SdTvNationalsRotator currentView={view} rotateSec={rotateSec} />
          {view === "wildcard" ? (
            <NationalsWildcardMap
              model={nationalsView.model}
              scores={nationalsView.wildcardScores}
              confirmedWildcardId={nationalsView.confirmedWildcardId}
              publicView
              tvMode
            />
          ) : (
            <NationalsKnockoutMap
              model={nationalsView.knockoutModel}
              preview={nationalsView.knockoutIsPreview}
              tvMode
            />
          )}
        </div>
      </div>
    );
  }

  if (mode === "event" && event) {
    const steps = buildSdTvEventSteps(areas);
    const stepIndex = Math.min(
      Math.max(parseInt(params.step ?? "0", 10) || 0, 0),
      steps.length - 1
    );
    const current = steps[stepIndex]!;

    let nationalsView: Awaited<ReturnType<typeof loadNationalsPublicView>> | null =
      null;
    if (current.kind === "nationals") {
      try {
        nationalsView = await loadNationalsPublicView(event.id);
      } catch {
        redirect(`${SWORD_DUELS_PUBLIC}/tv`);
      }
    }

    if (current.kind === "area") {
      const ctx = await getSdPublicArea(current.area);
      if (!ctx) redirect(SWORD_DUELS_PUBLIC);
      const publicScores = filterPublicScores(ctx.sets, ctx.scoreMap);

      return (
        <div className="fixed inset-0 z-50 overflow-auto p-4 sm:p-6">
          <ArBackdrop />
          <div className="relative mx-auto max-w-7xl">
            <SdTvEventRotator
              steps={steps}
              currentIndex={stepIndex}
              rotateSec={rotateSec}
            />
            <AreaTournamentMap
              bracket={ctx.bracket}
              sets={ctx.sets}
              scoresBySetId={publicScores}
              tvMode
              fullscreen
            />
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 overflow-auto p-4 sm:p-6">
        <ArBackdrop />
        <div className="relative mx-auto max-w-7xl">
          <SdTvEventRotator
            steps={steps}
            currentIndex={stepIndex}
            rotateSec={rotateSec}
          />
          {current.view === "wildcard" ? (
            <NationalsWildcardMap
              model={nationalsView!.model}
              scores={nationalsView!.wildcardScores}
              confirmedWildcardId={nationalsView!.confirmedWildcardId}
              publicView
              tvMode
            />
          ) : (
            <NationalsKnockoutMap
              model={nationalsView!.knockoutModel}
              preview={nationalsView!.knockoutIsPreview}
              tvMode
            />
          )}
        </div>
      </div>
    );
  }

  const currentArea =
    params.area && areas.includes(params.area) ? params.area : areas[0];
  const ctx = await getSdPublicArea(currentArea);

  if (!ctx) {
    redirect(SWORD_DUELS_PUBLIC);
  }

  const publicScores = filterPublicScores(ctx.sets, ctx.scoreMap);

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
          bracket={ctx.bracket}
          sets={ctx.sets}
          scoresBySetId={publicScores}
          tvMode
          fullscreen
        />
      </div>
    </div>
  );
}
