import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { NationalsKnockoutMap } from "@/components/sword-duels/NationalsKnockoutMap";
import { NationalsWildcardMap } from "@/components/sword-duels/NationalsWildcardMap";
import { SdTvRegionalStandingsBoard } from "@/components/sword-duels/SdTvRegionalStandingsBoard";
import {
  buildSdTvEventSteps,
  SdTvEventRotator,
} from "@/components/sword-duels/SdTvEventRotator";
import { SdTvAreaRotator } from "@/components/sword-duels/SdTvAreaRotator";
import { SdTvNationalsRotator } from "@/components/sword-duels/SdTvNationalsRotator";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { loadNationalsPublicView } from "@/lib/products/sword-duels/load-nationals-public-view";
import { loadV2NationalsPublicView } from "@/lib/products/sword-duels/load-v2-nationals-public-view";
import {
  filterPublicScores,
  getSdPublicArea,
  getSdPublicOverview,
} from "@/lib/products/sword-duels/public-queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import {
  isRegionalAverageFormat,
  parseNationalsTvView,
  type SdNationalsTvView,
} from "@/lib/products/sword-duels/tournament-format";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sword Duels — TV bracket",
};

function nationalsTvShell(children: ReactNode) {
  return (
    <div className="fixed inset-0 z-50 overflow-auto p-4 sm:p-6">
      <ArBackdrop />
      <div className="relative mx-auto max-w-7xl">{children}</div>
    </div>
  );
}

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
  const tournamentFormat = event?.tournament_format ?? "classic_v1";
  const isV2 = isRegionalAverageFormat(tournamentFormat);

  if (mode === "nationals" && event) {
    const view = parseNationalsTvView(params.view, tournamentFormat);

    if (isV2) {
      let v2View: Awaited<ReturnType<typeof loadV2NationalsPublicView>> | null =
        null;
      try {
        v2View = await loadV2NationalsPublicView(event.id);
      } catch {
        return nationalsTvShell(
          <p className="text-sd-muted">
            Nationals tables not ready. Run migration 030.{" "}
            <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
              Back
            </Link>
          </p>
        );
      }

      return nationalsTvShell(
        <>
          <SdTvNationalsRotator
            currentView={view}
            rotateSec={rotateSec}
            tournamentFormat={tournamentFormat}
          />
          {view === "regionals" ? (
            <SdTvRegionalStandingsBoard
              models={v2View.regionalStandings}
              tvMode
            />
          ) : (
            <NationalsKnockoutMap
              model={v2View.knockoutModel}
              preview={!v2View.knockoutIsLive}
              tvMode
            />
          )}
        </>
      );
    }

    let nationalsView;
    try {
      nationalsView = await loadNationalsPublicView(event.id);
    } catch {
      return nationalsTvShell(
        <p className="text-sd-muted">
          Nationals tables not ready. Run migrations 019/020.{" "}
          <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
            Back
          </Link>
        </p>
      );
    }

    return nationalsTvShell(
      <>
        <SdTvNationalsRotator
          currentView={view}
          rotateSec={rotateSec}
          tournamentFormat={tournamentFormat}
        />
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
      </>
    );
  }

  if (mode === "event" && event) {
    const steps = buildSdTvEventSteps(areas, tournamentFormat);
    const stepIndex = Math.min(
      Math.max(parseInt(params.step ?? "0", 10) || 0, 0),
      steps.length - 1
    );
    const current = steps[stepIndex]!;

    if (current.kind === "area") {
      const ctx = await getSdPublicArea(current.area);
      if (!ctx) redirect(SWORD_DUELS_PUBLIC);
      const publicScores = filterPublicScores(ctx.sets, ctx.scoreMap);

      return nationalsTvShell(
        <>
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
        </>
      );
    }

    const nationalsView = isV2
      ? await loadV2NationalsPublicView(event.id).catch(() => null)
      : await loadNationalsPublicView(event.id).catch(() => null);

    if (!nationalsView) {
      redirect(`${SWORD_DUELS_PUBLIC}/tv`);
    }

    const nationalsViewKind = current.view as SdNationalsTvView;

    return nationalsTvShell(
      <>
        <SdTvEventRotator
          steps={steps}
          currentIndex={stepIndex}
          rotateSec={rotateSec}
        />
        {isV2 ? (
          nationalsViewKind === "regionals" ? (
            <SdTvRegionalStandingsBoard
              models={
                (
                  nationalsView as Awaited<
                    ReturnType<typeof loadV2NationalsPublicView>
                  >
                ).regionalStandings
              }
              tvMode
            />
          ) : (
            <NationalsKnockoutMap
              model={
                (
                  nationalsView as Awaited<
                    ReturnType<typeof loadV2NationalsPublicView>
                  >
                ).knockoutModel
              }
              preview={
                !(
                  nationalsView as Awaited<
                    ReturnType<typeof loadV2NationalsPublicView>
                  >
                ).knockoutIsLive
              }
              tvMode
            />
          )
        ) : nationalsViewKind === "wildcard" ? (
          <NationalsWildcardMap
            model={
              (
                nationalsView as Awaited<
                  ReturnType<typeof loadNationalsPublicView>
                >
              ).model
            }
            scores={
              (
                nationalsView as Awaited<
                  ReturnType<typeof loadNationalsPublicView>
                >
              ).wildcardScores
            }
            confirmedWildcardId={
              (
                nationalsView as Awaited<
                  ReturnType<typeof loadNationalsPublicView>
                >
              ).confirmedWildcardId
            }
            publicView
            tvMode
          />
        ) : (
          <NationalsKnockoutMap
            model={
              (
                nationalsView as Awaited<
                  ReturnType<typeof loadNationalsPublicView>
                >
              ).knockoutModel
            }
            preview={
              (
                nationalsView as Awaited<
                  ReturnType<typeof loadNationalsPublicView>
                >
              ).knockoutIsPreview
            }
            tvMode
          />
        )}
      </>
    );
  }

  const currentArea =
    params.area && areas.includes(params.area) ? params.area : areas[0];
  const ctx = await getSdPublicArea(currentArea);

  if (!ctx) {
    redirect(SWORD_DUELS_PUBLIC);
  }

  const publicScores = filterPublicScores(ctx.sets, ctx.scoreMap);

  return nationalsTvShell(
    <>
      <SdTvAreaRotator
        areas={areas}
        currentArea={currentArea}
        rotateSec={rotateSec}
        tournamentFormat={tournamentFormat}
      />
      <AreaTournamentMap
        bracket={ctx.bracket}
        sets={ctx.sets}
        scoresBySetId={publicScores}
        tvMode
        fullscreen
      />
    </>
  );
}
