import { notFound, redirect } from "next/navigation";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ManualAdvancementPicks } from "@/components/admin/ManualAdvancementPicks";
import { getAdvancementPickContext } from "@/lib/data/admin-queries";
import { seasonPhaseLabel } from "@/lib/season-labels";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { nationalCompetitionsPath } from "@/lib/admin-routes";

export default async function RoundAdvancesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const ctx = await getAdvancementPickContext(id);
  if (!ctx) notFound();

  const phaseLabel = seasonPhaseLabel(ctx.seasonSlug);
  const roundLabel = `${phaseLabel} — ${ctx.round.name}`;

  return (
    <div className="space-y-4">
      <AdminBreadcrumb
        items={[
          { label: "Rounds", href: nationalCompetitionsPath("rounds") },
          {
            label: roundLabel,
            href: nationalCompetitionsPath("rounds", ctx.round.id),
          },
          { label: "Advancement picks" },
        ]}
      />
      <ManualAdvancementPicks
        roundId={ctx.round.id}
        roundName={ctx.round.name}
        roundNumber={ctx.round.round_number}
        nextRound={ctx.nextRound}
        mechanicsLabel={ctx.mechanics?.description ?? null}
        maxPoints={ctx.maxPoints}
        regions={ctx.regions}
      />
    </div>
  );
}
