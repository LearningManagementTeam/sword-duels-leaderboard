import Link from "next/link";
import {
  SD_MECHANICS_SUMMARY,
  SD_SCORING_MODE_LABELS,
  SD_SET_FLOW,
  SD_GROUP_SPLIT_RULE,
} from "@/lib/products/sword-duels/scoring-config";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

export const metadata = {
  title: "How area tournaments work — Sword Duels",
};

export default function SwordDuelsMechanicsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="sd-page-header">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← Sword Duels
        </Link>
        <h1>How area tournaments work</h1>
        <p>
          Each area runs two group battles. Two spot holders fight for one area
          representative.
        </p>
      </div>

      <section className="sd-neon-panel space-y-3 p-5">
        <ul className="list-disc space-y-2 pl-5 text-sm text-sd-muted">
          {SD_MECHANICS_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="sd-neon-panel p-5">
        <h2 className="font-semibold text-white">Grouping</h2>
        <p className="mt-2 text-sm text-sd-muted">{SD_GROUP_SPLIT_RULE}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">The three sets</h2>
        {SD_SET_FLOW.map((step) => (
          <div key={step.key} className="sd-inset rounded-lg p-4">
            <h3 className="font-medium text-white">{step.title}</h3>
            <p className="text-xs text-sd-gold">{step.spotLabel}</p>
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
