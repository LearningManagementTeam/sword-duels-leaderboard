import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { TvLeaderboardView } from "@/components/tv/TvLeaderboardView";
import { getBranding } from "@/lib/data/content-queries";
import {
  getLatestPublishedRoundNumber,
  getLastPublishedAt,
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import {
  getSurvivorCount,
  REGION_LABELS,
  type Region,
} from "@/lib/scoring-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const revalidate = 30;

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; region?: string; rotate?: string }>;
}) {
  const { phase = "june", region = "luzon", rotate } = await searchParams;
  const slugMap = {
    june: "june_area" as const,
    july: "july_region" as const,
    august: "august_finals" as const,
  };
  const slug = slugMap[phase as keyof typeof slugMap] ?? "june_area";

  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const branding = await getBranding();
  const season = await getSeasonBySlug(slug);
  const latestPublishedRound = season
    ? await getLatestPublishedRoundNumber(season.id)
    : 0;
  const reg = region as Region;
  const rows = season
    ? await getPublishedStandings(
        season.id,
        slug === "august_finals" ? undefined : reg
      )
    : [];
  const lastPublished = season ? await getLastPublishedAt(season.id) : null;

  const cutoff =
    slug === "august_finals"
      ? 1
      : latestPublishedRound > 0
        ? getSurvivorCount(slug, latestPublishedRound, reg) ?? 32
        : 32;

  let cutLineLabel: string | undefined;
  if (latestPublishedRound > 0 && slug !== "august_finals") {
    cutLineLabel = `Top ${cutoff} — Round ${latestPublishedRound + 1}`;
  }

  const rotateQuery = rotate ? `&rotate=${rotate}` : "";

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-sd-deep p-6">
      <ArBackdrop />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(["june", "july", "august"] as const).map((p) => (
            <Link
              key={p}
              href={`/tv?phase=${p}${p !== "august" ? `&region=${region}` : ""}${rotateQuery}`}
              className={`rounded-lg px-3 py-1 capitalize ${
                p === phase
                  ? "bg-sd-glow/20 text-sd-glow"
                  : "bg-sd-panel text-sd-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
        {slug !== "august_finals" && (
          <div className="flex flex-wrap items-center gap-2">
            {(["luzon", "ncr", "vismin"] as Region[]).map((r) => (
              <Link
                key={r}
                href={`/tv?phase=${phase}&region=${r}${rotateQuery}`}
                className={`rounded-lg px-3 py-1 ${
                  r === region
                    ? "bg-sd-glow/20 text-sd-glow"
                    : "bg-sd-panel text-sd-muted"
                }`}
              >
                {REGION_LABELS[r]}
              </Link>
            ))}
            <Link
              href={`/tv?phase=${phase}&region=${region}&rotate=60`}
              className="text-sd-muted hover:text-sd-glow"
            >
              Rotate 60s
            </Link>
            {rotate && (
              <Link
                href={`/tv?phase=${phase}&region=${region}`}
                className="text-sd-muted hover:text-sd-glow"
              >
                Stop rotate
              </Link>
            )}
          </div>
        )}
        <span className="text-sd-muted">Auto-refresh 30s</span>
      </div>

      <Suspense fallback={<p className="text-sd-muted">Loading TV view…</p>}>
        <TvLeaderboardView
          branding={branding}
          phase={phase}
          initialRegion={reg}
          rows={rows}
          seasonSlug={slug}
          latestPublishedRound={latestPublishedRound}
          advancementCutoff={cutoff}
          cutLineLabel={cutLineLabel}
          lastPublished={lastPublished}
          showArea={slug === "june_area"}
        />
      </Suspense>
    </div>
  );
}
