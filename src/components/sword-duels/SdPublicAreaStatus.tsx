import type { SdPublicAreaPhase } from "@/lib/products/sword-duels/public-area-summary";

const PHASE_STYLE: Record<
  SdPublicAreaPhase,
  { chip: string; text: string }
> = {
  awaiting_groups: {
    chip: "bg-emerald-500/10 text-emerald-100/80 ring-emerald-400/25",
    text: "text-sd-muted/70",
  },
  spot1_secured: {
    chip: "bg-cyan-500/10 text-cyan-100/90 ring-cyan-400/30",
    text: "text-cyan-100/80",
  },
  spot2_secured: {
    chip: "bg-cyan-500/10 text-cyan-100/90 ring-cyan-400/30",
    text: "text-cyan-100/80",
  },
  final_live: {
    chip: "bg-lime-500/15 text-lime-100 ring-lime-400/35",
    text: "text-lime-100/90",
  },
  area_champion: {
    chip: "bg-lime-500/20 text-lime-100 ring-lime-400/40",
    text: "text-emerald-300",
  },
};

interface Props {
  label: string;
  phase: SdPublicAreaPhase;
  championName?: string | null;
}

export function SdPublicAreaStatus({ label, phase, championName }: Props) {
  const style = PHASE_STYLE[phase];

  return (
    <div className="mt-2 space-y-1">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${style.chip}`}
      >
        {label}
      </span>
      {championName && (
        <p className={`text-sm ${style.text}`}>{championName}</p>
      )}
    </div>
  );
}
