const SLOT_HEIGHT = 40;
const SLOT_GAP = 6;

export function bracketTrackHeight(slotCount: number): number {
  return slotCount * SLOT_HEIGHT + Math.max(0, slotCount - 1) * SLOT_GAP;
}

function slotCenterY(
  index: number,
  count: number,
  trackCount?: number
): number {
  const blockHeight = bracketTrackHeight(count);
  const totalHeight = trackCount ? bracketTrackHeight(trackCount) : blockHeight;
  const offset = (totalHeight - blockHeight) / 2;
  return offset + index * (SLOT_HEIGHT + SLOT_GAP) + SLOT_HEIGHT / 2;
}

interface FanProps {
  slotCount: number;
  /** Align fan lines when wing lists differ in length */
  trackCount?: number;
  /** Which side the slots sit on */
  side: "left" | "right";
  accent?: "a" | "b" | "final";
  active?: boolean;
  className?: string;
}

/** Lines from a column of branch slots inward toward a single spot node. */
export function SdBracketFanConnectors({
  slotCount,
  trackCount,
  side,
  accent = "a",
  active = false,
  className = "",
}: FanProps) {
  if (slotCount === 0) return null;

  const height = bracketTrackHeight(trackCount ?? slotCount);
  const targetY = height / 2;
  const stroke =
    accent === "b"
      ? "rgb(163 230 53 / 0.45)"
      : accent === "final"
        ? "rgb(74 222 128 / 0.55)"
        : "rgb(52 211 153 / 0.45)";

  const xStart = side === "left" ? 0 : 48;
  const xEnd = side === "left" ? 48 : 0;

  return (
    <svg
      viewBox={`0 0 48 ${height}`}
      className={`hidden w-12 shrink-0 self-stretch lg:block ${className}`}
      aria-hidden
      preserveAspectRatio="none"
    >
      {Array.from({ length: slotCount }, (_, i) => {
        const y1 = slotCenterY(i, slotCount, trackCount);
        const c1x = side === "left" ? 18 : 30;
        const c2x = side === "left" ? 30 : 18;
        return (
          <path
            key={i}
            d={`M ${xStart} ${y1} C ${c1x} ${y1}, ${c2x} ${targetY}, ${xEnd} ${targetY}`}
            fill="none"
            stroke={stroke}
            strokeWidth={active ? "2" : "1.5"}
            className={active ? "sd-bracket-connector-flow" : undefined}
            opacity={active ? 1 : 0.75}
          />
        );
      })}
    </svg>
  );
}

interface ConvergeProps {
  active?: boolean;
  className?: string;
}

/** Horizontal merge from Spot 1 and Spot 2 toward the area final. */
export function SdBracketConvergeConnectors({
  active = false,
  className = "",
}: ConvergeProps) {
  const flow = active ? "sd-bracket-connector-flow" : undefined;
  const width = active ? "2" : "1.5";

  return (
    <svg
      viewBox="0 0 120 80"
      className={`mx-auto hidden h-16 w-full max-w-[10rem] lg:block ${className}`}
      aria-hidden
    >
      <path
        d="M 8 24 C 40 24, 50 40, 60 52"
        fill="none"
        stroke="rgb(52 211 153 / 0.5)"
        strokeWidth={width}
        className={flow}
      />
      <path
        d="M 112 24 C 80 24, 70 40, 60 52"
        fill="none"
        stroke="rgb(163 230 53 / 0.5)"
        strokeWidth={width}
        className={flow}
      />
      <path
        d="M 60 52 L 60 72"
        fill="none"
        stroke="rgb(74 222 128 / 0.55)"
        strokeWidth={active ? "2.5" : "2"}
        className={flow}
      />
    </svg>
  );
}

export { SLOT_HEIGHT, SLOT_GAP };
