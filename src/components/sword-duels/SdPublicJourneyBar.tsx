import Link from "next/link";
import type { SdPublicJourneyState } from "@/lib/products/sword-duels/public-journey";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

interface Props {
  journey: SdPublicJourneyState;
  /** `embedded` — step pills only (home hero, no duplicate progress panel). */
  variant?: "panel" | "embedded";
}

const V1_STEPS = [
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

const V2_STEPS = [
  { id: "areas" as const, label: "Area battles", href: SWORD_DUELS_PUBLIC },
  {
    id: "regionals" as const,
    label: "Regional rounds",
    href: `${SWORD_DUELS_PUBLIC}/nationals#regionals`,
  },
  {
    id: "knockout" as const,
    label: "Finals",
    href: `${SWORD_DUELS_PUBLIC}/nationals#knockout`,
  },
];

type JourneyStepId = (typeof V1_STEPS)[number]["id"] | "regionals";

function activeStep(journey: SdPublicJourneyState): JourneyStepId {
  if (journey.nationalsPhase === "knockout") return "knockout";
  if (journey.nationalsPhase === "wildcard") return "wildcard";
  if (journey.nationalsPhase === "regionals") return "regionals";
  return "areas";
}

type JourneyStep = { id: JourneyStepId; label: string; href: string };

function JourneyStepPills({
  journey,
  steps,
  current,
}: {
  journey: SdPublicJourneyState;
  steps: readonly JourneyStep[];
  current: JourneyStepId;
}) {
  return (
    <ol className="flex flex-wrap justify-center gap-2">
      {steps.map((step, i) => {
        const isCurrent = step.id === current;
        const isPast =
          (step.id === "areas" && journey.areasComplete) ||
          (step.id === "wildcard" && journey.nationalsPhase === "knockout") ||
          (step.id === "regionals" && journey.regionalsComplete) ||
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
  );
}

export function SdPublicJourneyBar({ journey, variant = "panel" }: Props) {
  const isV2 = isRegionalAverageFormat(journey.tournamentFormat);
  const steps = isV2 ? V2_STEPS : V1_STEPS;
  const current = activeStep(journey);
  const progress =
    journey.totalAreas > 0
      ? Math.round((journey.areasPublished / journey.totalAreas) * 100)
      : 0;

  if (variant === "embedded") {
    return (
      <div className="pt-2">
        <JourneyStepPills journey={journey} steps={steps} current={current} />
      </div>
    );
  }

  const statusLine = journey.areasComplete
    ? journey.knockoutComplete
      ? "National champion crowned"
      : journey.nationalsPhase === "knockout"
        ? "National finals underway"
        : isV2
          ? journey.regionalsComplete
            ? "Regional champions locked — finals next"
            : "Regional rounds (3-day average)"
          : "Wild card phase"
    : `${journey.areasPublished} of ${journey.totalAreas} area reps locked`;

  return (
    <section className="sd-neon-panel mb-6 overflow-hidden p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sd-glow">
            Tournament journey
            {isV2 && (
              <span className="ml-2 text-cyan-300/80">· Version 2</span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-sd-muted">{statusLine}</p>
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

      <JourneyStepPills journey={journey} steps={steps} current={current} />
    </section>
  );
}
