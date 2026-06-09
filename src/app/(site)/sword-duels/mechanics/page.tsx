import Link from "next/link";
import { ProgramRulesCrossLink } from "@/components/ProgramRulesCrossLink";
import { SdRegionalTournamentMap } from "@/components/sword-duels/SdRegionalTournamentMap";
import { SdV2FormatOverview } from "@/components/sword-duels/SdV2FormatOverview";
import {
  SD_MECHANICS_SUMMARY,
  SD_NATIONALS_PHASES_V1,
  SD_NATIONALS_PHASES_V2,
  SD_SCORING_MODE_LABELS,
  SD_SET_FLOW,
  SD_GROUP_SPLIT_RULE,
} from "@/lib/products/sword-duels/scoring-config";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import {
  isRegionalAverageFormat,
  SD_TOURNAMENT_FORMAT_LABELS,
  SD_TOURNAMENT_FORMAT_SUMMARY,
} from "@/lib/products/sword-duels/tournament-format";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "How Sword Duels works",
};

export default async function SwordDuelsMechanicsPage() {
  const event =
    isSupabaseConfigured() ? await getSdEvent().catch(() => null) : null;
  const isV2 = event
    ? isRegionalAverageFormat(event.tournament_format)
    : false;
  const nationalsPhases = isV2 ? SD_NATIONALS_PHASES_V2 : SD_NATIONALS_PHASES_V1;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="sd-page-header">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← Sword Duels
        </Link>
        <h1>How Sword Duels works</h1>
        <p>
          {isV2
            ? "Area group battles crown one representative per area. Nationals uses regional three-round averages, then a finals bracket."
            : "Area group battles crown one representative per area. Nationals adds a wild card and a knockout bracket to one champion."}
        </p>
        {event && (
          <p className="mt-2 text-xs text-cyan-300/80">
            Active format: {SD_TOURNAMENT_FORMAT_LABELS[event.tournament_format]}
          </p>
        )}
      </div>

      <ProgramRulesCrossLink variant="sword-duels" />
      <p className="text-sm text-sd-muted">
        <Link href="/tournament-journey" className="sd-link">
          View the full tournament map (areas through nationals finals) →
        </Link>
      </p>

      {isV2 ? (
        <SdV2FormatOverview />
      ) : (
        <SdRegionalTournamentMap compact />
      )}

      <section className="sd-neon-panel space-y-3 p-5">
        <ul className="list-disc space-y-2 pl-5 text-sm text-sd-muted">
          {SD_MECHANICS_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">
          Nationals journey{isV2 ? " (Version 2)" : ""}
        </h2>
        {nationalsPhases.map((phase, i) => (
          <div key={phase.key} className="sd-inset rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-200/80">
              Step {i + 1}
            </p>
            <h3 className="font-medium text-white">{phase.title}</h3>
            <p className="mt-1 text-sm text-sd-muted">{phase.description}</p>
          </div>
        ))}
        <p className="text-sm">
          <Link href={`${SWORD_DUELS_PUBLIC}/nationals`} className="sd-link">
            View live nationals map →
          </Link>
        </p>
      </section>

      {!isV2 && (
        <section className="sd-inset rounded-lg p-4 text-sm text-sd-muted">
          <p className="font-medium text-white">Also available: Version 2</p>
          <p className="mt-2">
            {SD_TOURNAMENT_FORMAT_SUMMARY.regional_average_v2} The committee
            picks the format on the admin dashboard before any scores are
            published.
          </p>
        </section>
      )}

      {isV2 && (
        <section className="sd-inset rounded-lg p-4 text-sm text-sd-muted">
          <p className="font-medium text-white">Version 1 (classic)</p>
          <p className="mt-2">{SD_TOURNAMENT_FORMAT_SUMMARY.classic_v1}</p>
        </section>
      )}

      <section className="sd-neon-panel p-5">
        <h2 className="font-semibold text-white">Grouping</h2>
        <p className="mt-2 text-sm text-sd-muted">{SD_GROUP_SPLIT_RULE}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">The three area sets</h2>
        {SD_SET_FLOW.map((step) => (
          <div key={step.key} className="sd-inset rounded-lg p-4">
            <h3 className="font-medium text-white">{step.title}</h3>
            <p className="text-xs text-emerald-300/90">{step.spotLabel}</p>
            <p className="mt-1 text-sm text-sd-muted">{step.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">Winning a set</h2>
        {Object.values(SD_SCORING_MODE_LABELS).map((mode) => (
          <div key={mode.label} className="sd-inset rounded-lg p-4">
            <h3 className="font-medium text-cyan-100">{mode.label}</h3>
            <p className="mt-1 text-sm text-sd-muted">{mode.description}</p>
          </div>
        ))}
        {isV2 && (
          <p className="text-sm text-sd-muted">
            Regional rounds use high-score mode only; the leaderboard ranks by
            average across the three published rounds.
          </p>
        )}
      </section>
    </div>
  );
}
