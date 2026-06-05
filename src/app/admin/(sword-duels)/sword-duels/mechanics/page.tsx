import Link from "next/link";
import {
  SD_MECHANICS_SUMMARY,
  SD_SCORING_MODE_LABELS,
  SD_SET_FLOW,
  SD_GROUP_SPLIT_RULE,
} from "@/lib/products/sword-duels/scoring-config";
import { swordDuelsPath } from "@/lib/admin-routes";

export default function SwordDuelsAdminMechanicsPage() {
  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Mechanics</h1>
        <p>Sword Duels area tournament — how groups, spots, and the area rep work.</p>
      </div>

      <section className="sd-neon-panel space-y-3 p-5">
        <h2 className="font-semibold text-white">Summary</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-sd-muted">
          {SD_MECHANICS_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
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
