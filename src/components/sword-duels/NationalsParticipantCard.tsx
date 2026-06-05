import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { NationalsEntrant } from "@/lib/products/sword-duels/nationals-entrant";

const REGION_RING: Record<Region, string> = {
  luzon: "ring-cyan-400/25",
  ncr: "ring-emerald-400/25",
  vismin: "ring-lime-400/25",
};

interface Props {
  entrant: NationalsEntrant;
  compact?: boolean;
  tvMode?: boolean;
  wildcard?: boolean;
  muted?: boolean;
  highlight?: boolean;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function NationalsParticipantCard({
  entrant,
  compact = false,
  tvMode = false,
  wildcard = false,
  muted = false,
  highlight = false,
}: Props) {
  const ring = wildcard
    ? "ring-fuchsia-400/35"
    : REGION_RING[entrant.region];

  const shell = wildcard
    ? "bg-gradient-to-br from-fuchsia-950/70 via-purple-950/50 to-fuchsia-900/40"
    : muted
      ? "bg-sd-deep/50"
      : highlight
        ? "bg-gradient-to-br from-emerald-900/90 via-emerald-800/70 to-lime-900/50"
        : "bg-gradient-to-br from-emerald-950/80 via-emerald-900/45 to-emerald-800/35";

  return (
    <div
      className={`relative overflow-hidden rounded-lg px-2.5 py-2 ring-1 ring-inset ${shell} ${ring} ${
        compact ? "py-1.5" : ""
      } ${muted ? "opacity-60" : ""}`}
    >
      {entrant.isWildcard && (
        <span className="absolute right-1.5 top-1 rounded bg-fuchsia-500/25 px-1 py-px text-[7px] font-bold uppercase tracking-wider text-fuchsia-100/90">
          WC
        </span>
      )}
      <div className="flex items-start gap-2">
        <span
          className={`flex shrink-0 items-center justify-center rounded font-bold ${
            wildcard
              ? "bg-fuchsia-950/50 text-fuchsia-100"
              : "bg-emerald-950/50 text-emerald-200/90"
          } ${tvMode ? "h-8 w-8 text-xs" : compact ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]"}`}
        >
          {initials(entrant.repName)}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-semibold leading-tight text-white ${
              tvMode ? "text-sm" : compact ? "text-[11px]" : "text-xs"
            }`}
          >
            {entrant.repName}
          </p>
          <p
            className={`truncate text-[9px] ${
              wildcard ? "text-fuchsia-200/55" : "text-emerald-200/55"
            }`}
          >
            {entrant.branchName}
            {entrant.branchCode ? ` · ${entrant.branchCode}` : ""}
          </p>
          {!compact && (
            <>
              <p className="truncate text-[8px] text-sd-muted/65">
                {entrant.slotLabel}
                {entrant.employeeNo ? ` · ${entrant.employeeNo}` : ""}
              </p>
              {entrant.position && (
                <p className="truncate text-[8px] text-sd-muted/50">
                  {entrant.position}
                </p>
              )}
            </>
          )}
          {!wildcard && (
            <p className="mt-0.5 text-[8px] uppercase tracking-wide text-emerald-200/40">
              {REGION_LABELS[entrant.region]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
