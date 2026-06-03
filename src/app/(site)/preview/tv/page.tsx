import Link from "next/link";
import { Suspense } from "react";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { PreviewBanner } from "@/components/PreviewBanner";
import { TvLeaderboardView } from "@/components/tv/TvLeaderboardView";
import { getBranding } from "@/lib/data/content-queries";
import { getDemoStandings } from "@/lib/demo/generate-demo-standings";
import {
  getSurvivorCount,
  REGION_LABELS,
  type Region,
  type SeasonSlug,
} from "@/lib/scoring-config";

export default async function PreviewTvPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; region?: string }>;
}) {
  const { phase = "june", region = "luzon" } = await searchParams;
  const slugMap: Record<string, SeasonSlug> = {
    june: "june_area",
    july: "july_region",
    august: "august_finals",
  };
  const slug = slugMap[phase] ?? "june_area";
  const reg = region as Region;
  const branding = await getBranding();
  const rows = getDemoStandings(
    slug,
    slug === "august_finals" ? undefined : reg
  );
  const cutoff =
    slug === "august_finals"
      ? 1
      : getSurvivorCount(slug, 3, reg) ?? 32;

  const pillActive =
    "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep";
  const pillIdle = "sd-glass text-sd-muted hover:text-white";

  let cutLineLabel: string | undefined;
  if (slug !== "august_finals") {
    cutLineLabel = `Top ${cutoff} — preview (Round 3 sample)`;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto p-6">
      <ArBackdrop />
      <div className="relative mb-4 space-y-3">
        <PreviewBanner />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {(["june", "july", "august"] as const).map((p) => (
              <Link
                key={p}
                href={`/preview/tv?phase=${p}${p !== "august" ? `&region=${region}` : ""}`}
                className={`rounded-xl px-3 py-1.5 capitalize ${
                  p === phase ? pillActive : pillIdle
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
                  href={`/preview/tv?phase=${phase}&region=${r}`}
                  className={`rounded-xl px-3 py-1.5 ${
                    r === region ? pillActive : pillIdle
                  }`}
                >
                  {REGION_LABELS[r]}
                </Link>
              ))}
            </div>
          )}
          <Link href="/preview" className={`rounded-xl px-3 py-1.5 ${pillIdle}`}>
            Exit TV
          </Link>
        </div>
      </div>

      <Suspense fallback={<p className="text-sd-muted">Loading preview TV…</p>}>
        <TvLeaderboardView
          branding={branding}
          phase={phase}
          initialRegion={reg}
          rows={rows}
          seasonSlug={slug}
          latestPublishedRound={3}
          advancementCutoff={cutoff}
          cutLineLabel={cutLineLabel}
          lastPublished={null}
          showArea={slug === "june_area"}
          tvBasePath="/preview/tv"
        />
      </Suspense>
    </div>
  );
}
