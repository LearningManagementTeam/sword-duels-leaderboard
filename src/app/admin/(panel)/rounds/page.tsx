import Link from "next/link";
import { AdminCallout } from "@/components/admin/AdminCallout";
import { InfoTip } from "@/components/admin/InfoTip";
import { getAdminDashboard } from "@/lib/data/admin-queries";
import { ADMIN_NAV_HINTS, ADMIN_ROUND_HINTS } from "@/lib/admin-action-hints";
import { seasonPhaseLabel } from "@/lib/season-labels";
import {
  usesPerRoundElimination,
  type SeasonSlug,
} from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type RoundRow = {
  id: string;
  name: string;
  round_number: number;
  status: string;
  seasons: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
};

const SEASON_ORDER: SeasonSlug[] = ["june_area", "july_region", "august_finals"];

function seasonSlugFromRow(row: RoundRow): SeasonSlug | null {
  const meta = Array.isArray(row.seasons) ? row.seasons[0] : row.seasons;
  return (meta?.slug as SeasonSlug) ?? null;
}

export default async function AdminRoundsPage() {
  const { rounds } = isSupabaseConfigured()
    ? await getAdminDashboard()
    : { rounds: [] as RoundRow[] };

  const grouped = (rounds as RoundRow[]).reduce(
    (acc, r) => {
      const slug = seasonSlugFromRow(r) ?? "unknown";
      if (!acc[slug]) acc[slug] = [];
      acc[slug].push(r);
      return acc;
    },
    {} as Record<string, RoundRow[]>
  );

  const orderedSections = [
    ...SEASON_ORDER.filter((slug) => grouped[slug]?.length).map((slug) => ({
      slug,
      label: seasonPhaseLabel(slug),
      seasonRounds: grouped[slug],
    })),
    ...Object.entries(grouped)
      .filter(([slug]) => !SEASON_ORDER.includes(slug as SeasonSlug))
      .map(([slug, seasonRounds]) => ({
        slug,
        label: slug,
        seasonRounds,
      })),
  ];

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Rounds</h1>
        <p>
          Enter results per round. Save as draft, then publish when ready.{" "}
          <InfoTip label="About scoring rounds">
            {ADMIN_NAV_HINTS["/admin/rounds"]} {ADMIN_ROUND_HINTS.advancementPicks}
          </InfoTip>
        </p>
      </div>

      <AdminCallout title="Round status">
        <strong>Draft</strong> — only admins see scores.{" "}
        <strong>Published</strong> — public leaderboards and cut lines update.
      </AdminCallout>

      {orderedSections.map(({ slug, label, seasonRounds }) => {
        const seasonSlug = SEASON_ORDER.includes(slug as SeasonSlug)
          ? (slug as SeasonSlug)
          : null;
        return (
          <section key={slug} className="sd-neon-panel p-5">
            <h2 className="mb-2 font-semibold text-sd-glow">{label}</h2>
            <ul className="space-y-1">
              {seasonRounds.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1"
                >
                  <Link href={`/admin/rounds/${r.id}`} className="sd-link">
                    {r.name}
                  </Link>
                  {r.round_number === 3 && r.status !== "published" && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-100">
                      score before lock
                    </span>
                  )}{" "}
                  <span className="text-xs text-sd-muted/60">({r.status})</span>
                  {r.status === "published" &&
                    seasonSlug &&
                    usesPerRoundElimination(seasonSlug) && (
                      <Link
                        href={`/admin/rounds/${r.id}/advances`}
                        className="text-xs text-fuchsia-300/90 hover:text-fuchsia-200"
                      >
                        · advancement picks
                      </Link>
                    )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
