import { RepAvatar } from "@/components/ui/RepAvatar";
import type { RegionalStandingsModel } from "@/lib/products/sword-duels/regional-standings";

interface Props {
  model: RegionalStandingsModel;
  showDraftScores?: boolean;
}

export function RegionalStandingsPanel({
  model,
  showDraftScores = false,
}: Props) {
  return (
    <section className="sd-neon-panel space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {model.label} regional standings
        </h2>
        <p className="mt-1 text-sm text-sd-muted">
          Highest average across three published rounds wins the regional slot
          for finals.
        </p>
        <p className="mt-2 text-xs text-sd-muted/80">
          {model.roundsPublished} of 3 rounds published
          {model.champion && (
            <span className="text-emerald-200">
              {" "}
              · Champion: {model.champion.repName} (avg{" "}
              {model.champion.average?.toFixed(2)})
            </span>
          )}
        </p>
      </div>

      <div className="sd-table-wrap sd-inset overflow-x-auto">
        <table className="sd-table min-w-[640px]">
          <thead>
            <tr>
              <th className="text-left">Rank</th>
              <th className="text-left">Representative</th>
              <th className="text-right">R1</th>
              <th className="text-right">R2</th>
              <th className="text-right">R3</th>
              <th className="text-right">Average</th>
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr
                key={row.branchId}
                className={
                  row.isChampion
                    ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/25"
                    : undefined
                }
              >
                <td className="font-mono text-sm text-emerald-100">
                  {row.rank}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <RepAvatar
                      name={row.repName}
                      photoUrl={row.photoUrl}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {row.repName}
                      </p>
                      <p className="text-[10px] text-sd-muted">
                        {row.area} · {row.branchName}
                      </p>
                    </div>
                  </div>
                </td>
                {row.roundScores.map((score, i) => (
                  <td key={i} className="text-right tabular-nums text-sm">
                    {score != null ? (
                      score
                    ) : showDraftScores ? (
                      <span className="text-sd-muted/50">—</span>
                    ) : (
                      <span className="text-sd-muted/40">—</span>
                    )}
                  </td>
                ))}
                <td className="text-right font-semibold tabular-nums text-lime-200">
                  {row.average != null ? row.average.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
