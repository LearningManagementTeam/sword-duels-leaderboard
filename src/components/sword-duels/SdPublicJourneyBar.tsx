import Link from "next/link";
import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

interface Props {
  journey: SdPublicJourneyState;
}

const STEPS = [
  { id: "areas" as const, label: "Area battles", href: SWORD_DUELS_PUBLIC },
  {
    id: "wildcard" as const,
    label: "Wild card",
    href: `${SWORD_DUELS_PUBLIC}/nationals#wildcard`,
  },
  {
    id: "knockout" as const,
    label: "Knockout",
    href: `${SWORD_DUELS_PUBLIC}/nationals#knockout`,
  },
];

function activeStep(journey: SdPublicJourneyState): (typeof STEPS)[number]["id"] {
  if (journey.nationalsPhase === "knockout") return "knockout";
  if (journey.nationalsPhase === "wildcard") return "wildcard";
  return "areas";
}

export function SdPublicJourneyBar({ journey }: Props) {
  const current = activeStep(journey);
  const progress =
    journey.totalAreas > 0
      ? Math.round((journey.areasPublished / journey.totalAreas) * 100)
      : 0;

  return (
    <section className="sd-neon-panel mb-6 overflow-hidden p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sd-glow">
            Tournament journey
          </p>
          <p className="mt-0.5 text-sm text-sd-muted">
            {journey.areasComplete
              ? journey.knockoutComplete
                ? "National champion crowned"
                : journey.nationalsPhase === "knockout"
                  ? "Nationals knockout underway"
                  : "Wild card phase"
              : `${journey.areasPublished} of ${journey.totalAreas} area reps locked`}
          </p>
        </div>
        {!journey.areasComplete && journey.totalAreas > 0 && (
          <span className="text-xs font-semibold tabular-nums text-lime-300/90">
            {progress}%
          </span>
        )}
      </div>

      {!journey.areasComplete && journey.totalAreas > 0 && (
        <div className="sd-neon-track mb-4 h-1.5 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((step, i) => {
          const isCurrent = step.id === current;
          const isPast =
            (step.id === "areas" && journey.areasComplete) ||
            (step.id === "wildcard" &&
              journey.nationalsPhase === "knockout") ||
            (step.id === "knockout" && journey.knockoutComplete);

          return (
            <li key={step.id} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-sd-muted/30" aria-hidden>
                  →
                </span>
              )}
              <Link
                href={step.href}
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition ${
                  isCurrent
                    ? "bg-lime-400/20 text-lime-100 ring-lime-400/45"
                    : isPast
                      ? "bg-emerald-500/10 text-emerald-200/80 ring-emerald-400/25"
                      : "bg-sd-deep/40 text-sd-muted/70 ring-emerald-500/15 hover:text-white"
                }`}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
