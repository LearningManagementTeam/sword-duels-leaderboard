import Link from "next/link";
import { branchCountLabel } from "@/lib/branch-targets";
import type { CompetitionMapConfig } from "@/lib/competition-map";
import {
  getBranchCount,
  getLatestPublishedRoundNumber,
  getSeasonBySlug,
} from "@/lib/data/queries";
import {
  buildScopeLabel,
  resolveFullBoardCta,
} from "@/lib/full-board-cta";
import { isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  mapConfig: CompetitionMapConfig;
}

export async function HomeFullLeaderboardCta({ mapConfig }: Props) {
  const branchCount = await getBranchCount();
  const scopeLabel = buildScopeLabel(branchCount, branchCountLabel);

  let junePublishedRound = 0;
  if (isSupabaseConfigured()) {
    const juneSeason = await getSeasonBySlug("june_area");
    if (juneSeason) {
      junePublishedRound = await getLatestPublishedRoundNumber(juneSeason.id);
    }
  }

  const { href, ctaLine, subtitle } = resolveFullBoardCta(
    mapConfig.milestoneId,
    junePublishedRound,
    scopeLabel
  );

  return (
    <section className="text-center">
      <Link
        href={href}
        className="sd-btn-primary inline-flex w-full max-w-md flex-col items-center gap-1 rounded-2xl px-6 py-4 text-base font-semibold sm:mx-auto"
      >
        <span>{ctaLine}</span>
        <span className="text-xs font-normal opacity-90">{subtitle}</span>
      </Link>
    </section>
  );
}
