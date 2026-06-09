import Link from "next/link";
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
import { swordDuelsPath } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function SwordDuelsAdminMechanicsPage() {
  const event = await getSdEvent();
  const activeFormat = event?.tournament_format ?? "classic_v1";
  const isV2 = isRegionalAverageFormat(activeFormat);

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Mechanics</h1>
        <p>
          Sword Duels area tournament — groups, spots, area rep, then nationals
          ({isV2 ? "Version 2" : "Version 1"}).
        </p>
        {event && (
          <p className="mt-2 text-sm text-cyan-300/90">
            Active format: {SD_TOURNAMENT_FORMAT_LABELS[activeFormat]}
          </p>
        )}
      </div>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-white">Tournament formats</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sd-inset rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white">Version 1</h3>
            <p className="mt-2 text-sm text-sd-muted">
              {SD_TOURNAMENT_FORMAT_SUMMARY.classic_v1}
            </p>
          </div>
          <div className="sd-inset rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white">Version 2</h3>
            <p className="mt-2 text-sm text-sd-muted">
              {SD_TOURNAMENT_FORMAT_SUMMARY.regional_average_v2}
            </p>
          </div>
        </div>
        <p className="text-xs text-sd-muted">
          Switch format on the dashboard before any set is published. Published
          scores lock the choice.
        </p>
      </section>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-white">Summary</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-sd-muted">
          {SD_MECHANICS_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-white">
          Nationals — {isV2 ? "Version 2" : "Version 1"} (active)
        </h2>
        {(isV2 ? SD_NATIONALS_PHASES_V2 : SD_NATIONALS_PHASES_V1).map(
          (phase) => (
            <div key={phase.key} className="sd-inset rounded-lg p-4">
              <h3 className="font-medium text-cyan-100">{phase.title}</h3>
              <p className="mt-2 text-sm text-sd-muted">{phase.description}</p>
            </div>
          )
        )}
      </section>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-white">Group split</h2>
        <p className="text-sm text-sd-muted">{SD_GROUP_SPLIT_RULE}</p>
        <p className="text-sm text-sd-muted">
          Example: 10 branches in Area 1 → branches 1–5 in Group A (Set 1), 6–10
          in Group B (Set 2).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-white">Set flow</h2>
        {SD_SET_FLOW.map((step) => (
          <div key={step.key} className="sd-inset rounded-lg p-4">
            <h3 className="font-medium text-cyan-100">{step.title}</h3>
            <p className="mt-1 text-xs text-sd-gold">{step.spotLabel}</p>
            <p className="mt-2 text-sm text-sd-muted">{step.description}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-white">Scoring modes</h2>
        {Object.values(SD_SCORING_MODE_LABELS).map((mode) => (
          <div key={mode.label} className="sd-inset rounded-lg p-4">
            <h3 className="font-medium text-white">{mode.label}</h3>
            <p className="mt-1 text-sm text-sd-muted">{mode.description}</p>
          </div>
        ))}
        {isV2 && (
          <p className="text-sm text-sd-muted">
            Regional rounds (admin → Regionals) always use high score; standings
            rank by average of published rounds.
          </p>
        )}
      </section>

      <p className="text-sm text-sd-muted">
        Full reference:{" "}
        <code className="text-xs">docs/sword-duels-mechanics.md</code>
      </p>

      <Link href={swordDuelsPath()} className="sd-link text-sm">
        ← Dashboard
      </Link>
    </div>
  );
}
