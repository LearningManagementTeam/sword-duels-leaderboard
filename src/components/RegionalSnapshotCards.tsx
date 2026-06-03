import type { StandingRow } from "@/lib/types";
import { getRoundMechanics, type SeasonSlug } from "@/lib/scoring-config";

interface Props {
  rows: StandingRow[];
  seasonSlug: SeasonSlug;
  latestPublishedRound: number;
  lastPublished: string | null;
}

export function RegionalSnapshotCards({
  rows,
  seasonSlug,
  latestPublishedRound,
  lastPublished,
}: Props) {
  const active = rows.filter(
    (r) => r.status === "active" || r.status === "advanced"
  ).length;
  const eliminated = rows.filter((r) => r.status === "eliminated").length;

  const mechanics =
    latestPublishedRound > 0
      ? getRoundMechanics(seasonSlug, latestPublishedRound)
      : null;

  let perfectCount = 0;
  let perfectLabel: string | null = null;
  if (mechanics && latestPublishedRound > 0) {
    const key =
      latestPublishedRound === 1
        ? "round1_points"
        : latestPublishedRound === 2
          ? "round2_points"
          : "round3_points";
    const maxScore =
      mechanics.kind === "quiz"
        ? mechanics.maxPoints
        : mechanics.kind === "race_to_correct"
          ? mechanics.maxCorrect
          : null;
    if (maxScore != null) {
      perfectCount = rows.filter((r) => {
        const pts = r[key as keyof StandingRow];
        return typeof pts === "number" && pts >= maxScore;
      }).length;
      perfectLabel = `Scored max (${maxScore}) this round`;
    } else if (mechanics.kind === "last_man_standing") {
      perfectCount = rows.filter((r) => r.round2_points === 1).length;
      perfectLabel = "Still standing";
    }
  }

  const tieBreaker = rows.filter((r) => r.status === "tie_breaker").length;

  const cards = [
    { label: "Advancing", value: String(active) },
    { label: "Tie breaker", value: String(tieBreaker) },
    { label: "Eliminated", value: String(eliminated) },
    { label: "Total shown", value: String(rows.length) },
  ];

  if (perfectLabel && perfectCount > 0) {
    cards.push({
      label: perfectLabel,
      value: String(perfectCount),
    });
  }

  return (
    <div className="sd-neon-panel space-y-3 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="sd-inset rounded-xl px-4 py-3">
            <p className="text-xs text-sd-muted/70">{c.label}</p>
            <p className="text-xl font-bold tabular-nums text-sd-glow">
              {c.value}
            </p>
          </div>
        ))}
      </div>
      {lastPublished && (
        <p className="text-xs text-sd-muted/60">
          Last published:{" "}
          {new Date(lastPublished).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}
