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
  if (mechanics && latestPublishedRound > 0) {
    const key =
      latestPublishedRound === 1
        ? "round1_points"
        : latestPublishedRound === 2
          ? "round2_points"
          : "round3_points";
    perfectCount = rows.filter((r) => {
      const pts = r[key as keyof StandingRow];
      return typeof pts === "number" && pts >= mechanics.maxPoints;
    }).length;
  }

  const cards = [
    { label: "Active / advancing", value: String(active) },
    { label: "Eliminated", value: String(eliminated) },
    { label: "Total shown", value: String(rows.length) },
  ];

  if (mechanics && perfectCount > 0) {
    cards.push({
      label: `Scored max (${mechanics.maxPoints}) this round`,
      value: String(perfectCount),
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="sd-glass rounded-lg px-4 py-3"
          >
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-xl font-bold tabular-nums text-sd-glow">
              {c.value}
            </p>
          </div>
        ))}
      </div>
      {lastPublished && (
        <p className="text-xs text-slate-500">
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
