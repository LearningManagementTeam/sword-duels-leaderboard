import { redirect } from "next/navigation";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import {
  getPublishedStandings,
  getSeasonBySlug,
} from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const revalidate = 30;

export default async function TvPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const { phase = "june" } = await searchParams;
  const slugMap = {
    june: "june_area" as const,
    july: "july_region" as const,
    august: "august_finals" as const,
  };
  const slug = slugMap[phase as keyof typeof slugMap] ?? "june_area";

  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const season = await getSeasonBySlug(slug);
  const rows = season ? await getPublishedStandings(season.id) : [];

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-950 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amber-400">
          Sword Duels — {phase.toUpperCase()}
        </h1>
        <p className="text-sm text-slate-400">Auto-refresh every 30s</p>
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
