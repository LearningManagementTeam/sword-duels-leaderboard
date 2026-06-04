import type { PlayoffColumn } from "@/lib/playoff-map";
import { connectorBranchIds, REGION_PLAYOFF_ACCENTS } from "@/lib/playoff-map";
import type { Region } from "@/lib/scoring-config";

const SLOT_HEIGHT = 48;
const SLOT_GAP = 8;

interface Props {
  from: PlayoffColumn;
  to: PlayoffColumn;
  region: Region;
}

function slotCenterY(index: number, count: number): number {
  const totalHeight = count * SLOT_HEIGHT + (count - 1) * SLOT_GAP;
  const startY = 0;
  return startY + index * (SLOT_HEIGHT + SLOT_GAP) + SLOT_HEIGHT / 2;
}

export function PlayoffColumnConnectors({ from, to, region }: Props) {
  if (!from.isRevealed || !to.isRevealed || from.slots.length === 0) {
    return null;
  }

  const linked = connectorBranchIds(from, to);
  const accent = REGION_PLAYOFF_ACCENTS[region].connector;
  const fromCount = from.slots.length;
  const toCount = Math.max(to.slots.length, 1);
  const height =
    Math.max(fromCount, toCount) * SLOT_HEIGHT +
    (Math.max(fromCount, toCount) - 1) * SLOT_GAP;

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  from.slots.forEach((fromSlot, fromIdx) => {
    if (!fromSlot.branch_id || !linked.has(fromSlot.branch_id)) return;
    const toIdx = to.slots.findIndex((s) => s.branch_id === fromSlot.branch_id);
    if (toIdx < 0) return;
    lines.push({
      x1: 0,
      y1: slotCenterY(fromIdx, fromCount),
      x2: 40,
      y2: slotCenterY(toIdx, toCount),
    });
  });

  if (lines.length === 0) {
    lines.push({
      x1: 0,
      y1: height / 2,
      x2: 40,
      y2: height / 2,
    });
  }

  return (
    <svg
      viewBox={`0 0 40 ${height}`}
      className="hidden w-10 shrink-0 self-stretch md:block"
      aria-hidden
      preserveAspectRatio="none"
    >
      {lines.map((line, i) => (
        <path
          key={i}
          d={`M ${line.x1} ${line.y1} C 14 ${line.y1}, 26 ${line.y2}, ${line.x2} ${line.y2}`}
          fill="none"
          className={`${accent} opacity-50`}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
