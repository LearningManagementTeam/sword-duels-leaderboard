import {
  getRoundMechanics,
  requiredSurvivorsPerRegion,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";

export interface PublishReadiness {
  blockers: string[];
  warnings: string[];
}

interface RowValue {
  branch_id: string;
  branch_name: string;
  region: Region;
  points: number;
  survived: boolean;
  finish_order: number | null;
}

/** Client-side checks before publishing a round. */
export function checkPublishReadiness(
  seasonSlug: SeasonSlug,
  roundNumber: number,
  values: RowValue[],
  tieBreakerPendingCount: number
): PublishReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const mechanics = getRoundMechanics(seasonSlug, roundNumber);
  const kind = mechanics?.kind ?? "quiz";

  if (values.length === 0) {
    blockers.push("No eligible branches to score for this round.");
    return { blockers, warnings };
  }

  if (kind === "last_man_standing") {
    for (const region of ["luzon", "ncr", "vismin"] as Region[]) {
      const required =
        requiredSurvivorsPerRegion(seasonSlug, roundNumber, region) ?? 0;
      const count = values.filter(
        (v) => v.region === region && v.survived
      ).length;
      if (count !== required) {
        blockers.push(
          `${region}: ${count} marked survived — need exactly ${required}.`
        );
      }
    }
  }

  if (kind === "race_to_correct") {
    const maxCorrect =
      mechanics?.kind === "race_to_correct" ? mechanics.maxCorrect : 5;
    const qualified = values.filter((v) => v.points >= maxCorrect);
    const missingOrder = qualified.filter((v) => v.finish_order == null);
    if (missingOrder.length > 0) {
      blockers.push(
        `${missingOrder.length} branch(es) reached ${maxCorrect} correct but have no finish order.`
      );
    }
    const orders = qualified
      .map((v) => v.finish_order)
      .filter((o): o is number => o != null);
    const dupes = orders.filter((o, i) => orders.indexOf(o) !== i);
    if (dupes.length > 0) {
      blockers.push(
        `Duplicate finish orders: ${[...new Set(dupes)].join(", ")}.`
      );
    }
  }

  if (tieBreakerPendingCount > 0) {
    warnings.push(
      `${tieBreakerPendingCount} branch(es) still have tie-breaker status from the prior round — confirm results before publishing.`
    );
  }

  if (kind === "quiz") {
    const unscored = values.filter((v) => Number.isNaN(v.points));
    if (unscored.length > 0) {
      blockers.push(`${unscored.length} branch(es) have invalid scores.`);
    }
  }

  return { blockers, warnings };
}

export function formatPublishConfirmMessage(
  roundName: string,
  readiness: PublishReadiness
): string {
  const lines = [`Publish ${roundName}? This updates the public leaderboard.`];
  if (readiness.warnings.length > 0) {
    lines.push("", "Warnings:", ...readiness.warnings.map((w) => `• ${w}`));
  }
  return lines.join("\n");
}
