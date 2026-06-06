"use client";

import type { SdSetType } from "@/lib/products/sword-duels/types";

export type SdAreaScoreNavItem = {
  setType: SdSetType;
  title: string;
  status: "published" | "draft" | "locked";
};

interface Props {
  area: string;
  items: SdAreaScoreNavItem[];
}

const STATUS_STYLES = {
  published:
    "bg-lime-400/15 text-lime-100 ring-lime-400/35",
  draft: "bg-cyan-400/15 text-cyan-100 ring-cyan-400/35",
  locked: "bg-sd-deep/50 text-sd-muted/70 ring-emerald-800/35",
} as const;

const STATUS_LABELS = {
  published: "Published",
  draft: "Draft",
  locked: "Locked",
} as const;

function scrollToSet(setType: SdSetType) {
  document
    .getElementById(setType)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SdAreaScoreStickyNav({ area, items }: Props) {
  const nextItem = items.find((item) => item.status === "draft");

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-500/20 bg-sd-panel/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sd-glow">
            Score entry · {area}
          </p>
          {nextItem ? (
            <p className="truncate text-sm text-sd-muted">
              Next:{" "}
              <span className="font-medium text-white">{nextItem.title}</span>
            </p>
          ) : (
            <p className="text-sm text-emerald-300">All sets published</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <button
              key={item.setType}
              type="button"
              onClick={() => scrollToSet(item.setType)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition hover:brightness-110 ${
                nextItem?.setType === item.setType
                  ? "ring-2 ring-cyan-400/50"
                  : STATUS_STYLES[item.status]
              }`}
            >
              <span className="max-w-[7rem] truncate sm:max-w-none">
                {item.title.replace(/^Set \d+ — /, "Set ")}
              </span>
              <span
                className={`hidden rounded px-1 py-0.5 text-[9px] uppercase tracking-wide sm:inline ${
                  STATUS_STYLES[item.status]
                }`}
              >
                {STATUS_LABELS[item.status]}
              </span>
            </button>
          ))}
          {nextItem && (
            <button
              type="button"
              onClick={() => scrollToSet(nextItem.setType)}
              className="sd-btn-primary rounded-lg px-3 py-1.5 text-xs font-semibold"
            >
              Jump →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
