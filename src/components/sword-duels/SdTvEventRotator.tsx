"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import type { SdNationalsTvView } from "@/lib/products/sword-duels/tournament-format";
import {
  SD_NATIONALS_TV_VIEW_LABELS,
  sdNationalsTvViews,
} from "@/lib/products/sword-duels/tournament-format";

export type SdTvEventStep =
  | { kind: "area"; area: string }
  | { kind: "nationals"; view: SdNationalsTvView };

interface Props {
  steps: SdTvEventStep[];
  currentIndex: number;
  rotateSec: number;
}

function stepLabel(step: SdTvEventStep): string {
  if (step.kind === "area") return step.area;
  return SD_NATIONALS_TV_VIEW_LABELS[step.view];
}

function stepHref(index: number, rotateSec: number): string {
  const params = new URLSearchParams({
    mode: "event",
    step: String(index),
  });
  if (rotateSec > 0) params.set("rotate", String(rotateSec));
  return `${SWORD_DUELS_PUBLIC}/tv?${params.toString()}`;
}

export function SdTvEventRotator({ steps, currentIndex, rotateSec }: Props) {
  const router = useRouter();
  const current = steps[currentIndex];

  useEffect(() => {
    if (!rotateSec || rotateSec < 10 || steps.length < 2) return;
    const id = setInterval(() => {
      const next = (currentIndex + 1) % steps.length;
      router.push(stepHref(next, rotateSec));
    }, rotateSec * 1000);
    return () => clearInterval(id);
  }, [rotateSec, currentIndex, steps.length, router]);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <Link
            key={`${step.kind}-${step.kind === "area" ? step.area : step.view}-${i}`}
            href={stepHref(i, rotateSec)}
            className={`rounded-xl px-3 py-1.5 transition ${
              i === currentIndex
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                : "sd-glass text-sd-muted hover:text-white"
            }`}
          >
            {stepLabel(step)}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={stepHref(currentIndex, 90)}
          className="text-sd-muted hover:text-sd-glow"
        >
          Rotate 90s
        </Link>
        {rotateSec > 0 && (
          <Link
            href={stepHref(currentIndex, 0)}
            className="text-sd-muted hover:text-sd-glow"
          >
            Stop rotate
          </Link>
        )}
        {current?.kind === "area" && (
          <Link
            href={`${SWORD_DUELS_PUBLIC}/${areaSlug(current.area)}`}
            className="text-sd-muted hover:text-sd-glow"
          >
            Standard view
          </Link>
        )}
        {current?.kind === "nationals" && (
          <Link
            href={`${SWORD_DUELS_PUBLIC}/nationals`}
            className="text-sd-muted hover:text-sd-glow"
          >
            Standard view
          </Link>
        )}
        <Link href={`${SWORD_DUELS_PUBLIC}/tv`} className="text-sd-muted hover:text-sd-glow">
          Areas only
        </Link>
      </div>
    </div>
  );
}

export function buildSdTvEventSteps(
  areas: string[],
  format: import("@/lib/products/sword-duels/tournament-format").SdTournamentFormat | null | undefined
): SdTvEventStep[] {
  const nationalsViews = sdNationalsTvViews(format);
  return [
    ...areas.map((area) => ({ kind: "area" as const, area })),
    ...nationalsViews.map((view) => ({
      kind: "nationals" as const,
      view,
    })),
  ];
}
