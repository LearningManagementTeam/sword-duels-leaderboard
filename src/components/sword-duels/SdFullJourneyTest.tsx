import Link from "next/link";
import { AreaGroupStandingsPanel } from "@/components/sword-duels/AreaGroupStandingsPanel";
import { AreaTournamentMap } from "@/components/sword-duels/AreaTournamentMap";
import { NationalsKnockoutSection } from "@/components/sword-duels/NationalsKnockoutSection";
import { NationalsWildcardMap } from "@/components/sword-duels/NationalsWildcardMap";
import { RegionalStandingsPanel } from "@/components/sword-duels/RegionalStandingsPanel";
import { SdCollapsibleSection } from "@/components/sword-duels/SdCollapsibleSection";
import { SdFullJourneyPhaseNav } from "@/components/sword-duels/SdFullJourneyPhaseNav";
import { SdPublicAreaStatus } from "@/components/sword-duels/SdPublicAreaStatus";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import {
  getSdPublicAreaSummary,
  resolveAreaChampionDisplayName,
} from "@/lib/products/sword-duels/public-area-summary";
import type { FullJourneyAreaSlice } from "@/lib/products/sword-duels/load-full-journey-view";
import type { loadFullJourneyView } from "@/lib/products/sword-duels/load-full-journey-view";
import type { SdAreaSchedulesConfig } from "@/lib/products/sword-duels/area-schedules";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

type JourneyView = NonNullable<Awaited<ReturnType<typeof loadFullJourneyView>>>;

function AreaGroupRow({
  slice,
  schedules,
}: {
  slice: FullJourneyAreaSlice;
  schedules: SdAreaSchedulesConfig;
}) {
  const { bracket, sets, publicScores, groupPublished } = slice;
  const groupSets = sets.filter(
    (s) => s.set_type === "group_a" || s.set_type === "group_b"
  );
  const championName = resolveAreaChampionDisplayName(sets, publicScores, bracket);
  const summary = getSdPublicAreaSummary(sets, championName);

  return (
    <SdCollapsibleSection
      id={`groups-${bracket.area.replace(/\s+/g, "-").toLowerCase()}`}
      title={bracket.area}
      subtitle={`${REGION_LABELS[bracket.region as Region]} · ${bracket.branchCount} branches · ${summary.label}`}
      defaultOpen={groupPublished}
    >
      <div className="space-y-4">
        <SdPublicAreaStatus
          label={summary.label}
          phase={summary.phase}
          championName={summary.championName}
        />
        <AreaGroupStandingsPanel
          area={bracket.area}
          scheduleConfig={schedules}
          bracket={bracket}
          groupSets={groupSets}
          publicScores={publicScores}
          prominent={groupPublished}
        />
      </div>
    </SdCollapsibleSection>
  );
}

function AreaFinalRow({
  slice,
  schedules,
}: {
  slice: FullJourneyAreaSlice;
  schedules: SdAreaSchedulesConfig;
}) {
  const { bracket, sets, publicScores, areaFinalPublished } = slice;
  const championName = resolveAreaChampionDisplayName(sets, publicScores, bracket);
  const summary = getSdPublicAreaSummary(sets, championName);

  return (
    <SdCollapsibleSection
      id={`final-${bracket.area.replace(/\s+/g, "-").toLowerCase()}`}
      title={bracket.area}
      subtitle={
        championName
          ? `Area rep — ${championName}`
          : areaFinalPublished
            ? "Area final published"
            : summary.label
      }
      defaultOpen={areaFinalPublished}
    >
      <AreaTournamentMap
        bracket={bracket}
        sets={sets}
        scoresBySetId={publicScores}
        scheduleConfig={schedules}
        embedded
      />
    </SdCollapsibleSection>
  );
}

export function SdFullJourneyTest({ view }: { view: JourneyView }) {
  const { schedules, isV2, areas, v2Nationals, v1Nationals } = view;

  const phases = isV2
    ? [
        { id: "phase-groups", label: "Group battles" },
        { id: "phase-area-finals", label: "Area selections" },
        { id: "phase-regionals", label: "Regional battles" },
        { id: "phase-finals", label: "National finals" },
      ]
    : [
        { id: "phase-groups", label: "Group battles" },
        { id: "phase-area-finals", label: "Area selections" },
        { id: "phase-wildcard", label: "Wild card" },
        { id: "phase-finals", label: "Nationals knockout" },
      ];

  const knockoutSubtitle = isV2
    ? v2Nationals?.knockoutIsLive
      ? "Live finals — three regional champions."
      : v2Nationals?.finalsFieldLocked
        ? "Regional winners locked — publish finals when ready."
        : "Complete regional rounds to lock the finals field."
    : v1Nationals?.knockoutIsLive
      ? "Live knockout — winners advance as matches publish."
      : v1Nationals?.model.allFieldLocked
        ? "Field locked — knockout pairings active."
        : "Wildcard and area reps must lock before knockout.";

  return (
    <div className="space-y-6">
      <div
        role="status"
        className="rounded-xl border border-amber-400/25 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/90"
      >
        <p className="font-semibold">Temporary test page</p>
        <p className="mt-1 text-amber-100/75">
          Full Sword Duels journey on one scroll — live data when published. Not
          linked from public nav. Per-area pages remain at{" "}
          <Link href={SWORD_DUELS_PUBLIC} className="sd-link underline">
            Sword Duels home
          </Link>
          .
        </p>
      </div>

      <SdFullJourneyPhaseNav phases={phases} />

      <section id="phase-groups" className="scroll-mt-36 space-y-4">
        <header className="sd-page-header">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300/80">
            Phase 1
          </p>
          <h2 className="text-xl font-bold text-white">Branch group battles</h2>
          <p className="text-sm text-sd-muted">
            Group A and Group B scored rounds per area — top branches earn Spot 1
            and Spot 2.
          </p>
        </header>
        <div className="space-y-3">
          {areas.map((slice) => (
            <AreaGroupRow
              key={`g-${slice.bracket.area}`}
              slice={slice}
              schedules={schedules}
            />
          ))}
        </div>
      </section>

      <section id="phase-area-finals" className="scroll-mt-36 space-y-4">
        <header className="sd-page-header">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
            Phase 2
          </p>
          <h2 className="text-xl font-bold text-white">
            Area representative selections
          </h2>
          <p className="text-sm text-sd-muted">
            Spot holders from each group battle for one area representative.
          </p>
        </header>
        <div className="space-y-3">
          {areas.map((slice) => (
            <AreaFinalRow key={`f-${slice.bracket.area}`} slice={slice} schedules={schedules} />
          ))}
        </div>
      </section>

      {isV2 ? (
        <section id="phase-regionals" className="scroll-mt-36 space-y-4">
          <header className="sd-page-header">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/80">
              Phase 3
            </p>
            <h2 className="text-xl font-bold text-white">
              Regional representative battles
            </h2>
            <p className="text-sm text-sd-muted">
              Area reps grouped by Luzon, NCR, and VisMin — three scored rounds,
              highest average wins the region.
            </p>
          </header>
          {v2Nationals ? (
            <div className="grid gap-6">
              {v2Nationals.regionalStandings.map((model) => (
                <div key={model.region}>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    {REGION_LABELS[model.region]}
                  </h3>
                  <RegionalStandingsPanel model={model} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-sd-muted">
              Regional standings load when area reps and regional sets are configured.
            </p>
          )}
        </section>
      ) : (
        <section id="phase-wildcard" className="scroll-mt-36 space-y-4">
          <header className="sd-page-header">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/80">
              Phase 3
            </p>
            <h2 className="text-xl font-bold text-white">Wild card round</h2>
            <p className="text-sm text-sd-muted">
              Sixteen area reps plus one wild card slot fight for knockout seeding.
            </p>
          </header>
          {v1Nationals ? (
            <NationalsWildcardMap
              model={v1Nationals.model}
              scores={v1Nationals.wildcardScores}
              confirmedWildcardId={v1Nationals.confirmedWildcardId}
              publicView
            />
          ) : (
            <p className="text-sm text-sd-muted">Wildcard arena loads when configured.</p>
          )}
        </section>
      )}

      <section id="phase-finals" className="scroll-mt-36">
        <header className="mb-4 sd-page-header">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">
            Phase {isV2 ? 4 : 4}
          </p>
          <h2 className="text-xl font-bold text-white">National finals</h2>
          <p className="text-sm text-sd-muted">
            {isV2
              ? "Three regional champions — single-elimination to one national winner."
              : "Area vs area knockout bracket to crown the national champion."}
          </p>
        </header>
        {isV2 && v2Nationals ? (
          <NationalsKnockoutSection
            model={v2Nationals.knockoutModel}
            preview={!v2Nationals.knockoutIsLive}
            defaultOpen={v2Nationals.finalsFieldLocked || v2Nationals.knockoutIsLive}
            subtitle={knockoutSubtitle}
          />
        ) : !isV2 && v1Nationals ? (
          <NationalsKnockoutSection
            model={v1Nationals.knockoutModel}
            preview={v1Nationals.knockoutIsPreview}
            defaultOpen={
              v1Nationals.model.allFieldLocked || v1Nationals.knockoutIsLive
            }
            subtitle={knockoutSubtitle}
          />
        ) : (
          <p className="text-sm text-sd-muted">Finals bracket loads when the field locks.</p>
        )}
      </section>
    </div>
  );
}
