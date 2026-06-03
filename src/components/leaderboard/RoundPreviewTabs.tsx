"use client";

import Link from "next/link";
import { PREVIEW_ROUNDS, type PreviewRound } from "@/lib/compare-preview-constants";

interface Props {
  activeRound: PreviewRound;
  basePath?: string;
}

export function RoundPreviewTabs({
  activeRound,
  basePath = "/compare/leaderboard/three-columns",
}: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/70">
        Preview by round (three-column layout)
      </p>
      <div className="flex flex-wrap gap-2">
        {PREVIEW_ROUNDS.map((r) => {
          const active = r.round === activeRound;
          return (
            <Link
              key={r.round}
              href={`${basePath}?round=${r.slug}`}
              className={`rounded-xl px-4 py-2.5 text-sm transition ${
                active
                  ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                  : "sd-glass text-sd-muted hover:text-sd-glow"
              }`}
            >
              R{r.round}: {r.name}
              {r.approvedLayout && (
                <span className="ml-1.5 text-[10px] font-bold uppercase opacity-90">
                  · chosen
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
