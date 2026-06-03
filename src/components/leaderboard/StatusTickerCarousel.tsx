interface Props {
  lastPublished: string | null;
}

const STATUS_ITEMS = [
  { key: "advancing", label: "Advancing", hint: "qualified for next round" },
  { key: "tie", label: "Tie breaker", hint: "play-off for remaining slots" },
  { key: "out", label: "Eliminated", hint: "out at published round" },
] as const;

/** Wrapping status legend — readable on mobile (no horizontal marquee clip). */
export function StatusLegend({ lastPublished }: Props) {
  const legendItems: { key: string; label: string; hint: string }[] = [
    ...STATUS_ITEMS,
  ];

  if (lastPublished) {
    legendItems.push({
      key: "updated",
      label: "Last published",
      hint: new Date(lastPublished).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    });
  }

  return (
    <div
      className="sd-glass rounded-xl px-3 py-2.5"
      role="region"
      aria-label="Status legend"
    >
      <ul className="flex flex-wrap justify-center gap-1.5 sm:justify-start sm:gap-2">
        {legendItems.map((item) => (
          <li
            key={item.key}
            className="rounded-full border border-emerald-400/25 bg-emerald-950/40 px-2.5 py-1 text-[10px] leading-snug text-sd-muted sm:px-3 sm:text-xs"
          >
            <span className="font-semibold text-sd-glow/90">{item.label}</span>
            <span className="text-sd-muted/80"> — {item.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** @deprecated Use StatusLegend — kept for import stability during transition */
export const StatusTickerCarousel = StatusLegend;
