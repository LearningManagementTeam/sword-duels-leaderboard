import Link from "next/link";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { PreviewBanner } from "@/components/PreviewBanner";
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
  const rows = getDemoStandings(
    slug,
    slug === "august_finals" ? undefined : (region as Region)
  );
  const cutoff =
    slug === "august_finals"
      ? 1
      : getSurvivorCount(slug, 3, region as Region) ?? 32;

  const pillActive =
    "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep";
  const pillIdle = "sd-glass text-sd-muted hover:text-white";

  return (
    <div className="fixed inset-0 z-50 overflow-auto p-6">
      <ArBackdrop />
      <div className="relative mb-4 space-y-3">
        <PreviewBanner />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-sd-glow">
            Sword Duels — {phase.toUpperCase()} (Preview)
            {slug !== "august_finals" && (
              <span className="ml-2 text-xl text-sd-muted">
                {REGION_LABELS[region as Region]}
              </span>
            )}
          </h1>
          <div className="flex flex-wrap gap-2 text-sm">
            {(["june", "july", "august"] as const).map((p) => (
              <Link
                key={p}
                href={`/preview/tv?phase=${p}&region=${region}`}
                className={`rounded-xl px-3 py-1.5 capitalize ${
                  p === phase ? pillActive : pillIdle
                }`}
              >
                {p}
              </Link>
            ))}
            {slug !== "august_finals" &&
              (["luzon", "ncr", "vismin"] as Region[]).map((r) => (
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
            <Link href="/preview" className={`rounded-xl px-3 py-1.5 ${pillIdle}`}>
              Exit TV
            </Link>
          </div>
        </div>
      </div>
      <LeaderboardTable
        rows={rows}
        advancementCutoff={cutoff}
        showArea={slug === "june_area"}
        showRepresentatives
        seasonSlug={slug}
        latestPublishedRound={3}
        compact
      />
    </div>
  );
}
