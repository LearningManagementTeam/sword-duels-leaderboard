import Link from "next/link";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { PreviewBanner } from "@/components/PreviewBanner";
import { getDemoStandings } from "@/lib/demo/generate-demo-standings";
import type { SeasonSlug } from "@/lib/scoring-config";

export default async function PreviewTvPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const { phase = "june" } = await searchParams;
  const slugMap: Record<string, SeasonSlug> = {
    june: "june_area",
    july: "july_region",
    august: "august_finals",
  };
  const slug = slugMap[phase] ?? "june_area";
  const rows = getDemoStandings(slug);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-950 p-6">
      <div className="mb-4 space-y-3">
        <PreviewBanner />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-amber-400">
            Sword Duels — {phase.toUpperCase()} (Preview)
          </h1>
          <div className="flex gap-2 text-sm">
            {(["june", "july", "august"] as const).map((p) => (
              <Link
                key={p}
                href={`/preview/tv?phase=${p}`}
                className={`rounded-lg px-3 py-1 ${
                  p === phase
                    ? "bg-amber-500/20 text-amber-200"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {p}
              </Link>
            ))}
            <Link
              href="/preview"
              className="rounded-lg bg-slate-800 px-3 py-1 text-slate-300 hover:bg-slate-700"
            >
              Exit TV
            </Link>
          </div>
        </div>
      </div>
      <LeaderboardTable
        rows={rows}
        advancementCutoff={slug === "june_area" ? 24 : 1}
        showArea={slug === "june_area"}
        showRepresentatives
        compact
      />
    </div>
  );
}
