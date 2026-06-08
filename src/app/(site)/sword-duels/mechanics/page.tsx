import Link from "next/link";
import { ProgramRulesCrossLink } from "@/components/ProgramRulesCrossLink";
import { SdRegionalTournamentMap } from "@/components/sword-duels/SdRegionalTournamentMap";
import {
  SD_MECHANICS_SUMMARY,
  SD_NATIONALS_PHASES,
  SD_SCORING_MODE_LABELS,
  SD_SET_FLOW,
  SD_GROUP_SPLIT_RULE,
} from "@/lib/products/sword-duels/scoring-config";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

export const metadata = {
  title: "How Sword Duels works",
};

export default function SwordDuelsMechanicsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="sd-page-header">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← Sword Duels
        </Link>
        <h1>How Sword Duels works</h1>
        <p>
          Area group battles crown one representative per area. Nationals adds a
          wild card and a knockout bracket to one champion.
        </p>
      </div>

      <ProgramRulesCrossLink variant="sword-duels" />
      <p className="text-sm text-sd-muted">
        <Link href="/tournament-journey" className="sd-link">
          View the full tournament map (areas through nationals finals) →
        </Link>
      </p>

      <SdRegionalTournamentMap compact />

      <section className="sd-neon-panel space-y-3 p-5">
        <ul className="list-disc space-y-2 pl-5 text-sm text-sd-muted">
          {SD_MECHANICS_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">Nationals journey</h2>
        {SD_NATIONALS_PHASES.map((phase, i) => (
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
      </section>
    </div>
  );
}
