import type { SdDashboardArea } from "@/lib/products/sword-duels/queries";
import {
  getSdAreaStatus,
  type SdAreaStatusPhase,
} from "@/lib/products/sword-duels/area-status";

const PHASE_STYLES: Record<SdAreaStatusPhase, string> = {
  area_champion:
    "bg-lime-400/15 text-lime-100 ring-lime-400/40",
  final_live:
    "bg-emerald-500/15 text-emerald-100 ring-emerald-400/35",
  spot1_secured:
    "bg-cyan-500/12 text-cyan-100/90 ring-cyan-400/30",
  spot2_secured:
    "bg-lime-500/12 text-lime-100/90 ring-lime-400/30",
  awaiting_groups:
    "bg-sd-deep/50 text-sd-muted/75 ring-emerald-800/35",
};

interface Props {
  area: SdDashboardArea;
  align?: "left" | "right";
}

export function SdAreaStatusBadge({ area, align = "right" }: Props) {
  const status = getSdAreaStatus(area);

  return (
    <div
      className={`flex shrink-0 flex-col gap-0.5 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${PHASE_STYLES[status.phase]}`}
      >
        {status.label}
      </span>
      {status.detail && (
        <span className="max-w-[11rem] text-[10px] leading-snug text-sd-muted/70">
          {status.detail}
        </span>
      )}
    </div>
  );
}
