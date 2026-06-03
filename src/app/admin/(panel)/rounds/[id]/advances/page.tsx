import { notFound, redirect } from "next/navigation";
import { ManualAdvancementPicks } from "@/components/admin/ManualAdvancementPicks";
import { getAdvancementPickContext } from "@/lib/data/admin-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function RoundAdvancesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const ctx = await getAdvancementPickContext(id);
  if (!ctx) notFound();

  return (
    <ManualAdvancementPicks
      roundId={ctx.round.id}
      roundName={ctx.round.name}
      roundNumber={ctx.round.round_number}
      nextRound={ctx.nextRound}
      mechanicsLabel={ctx.mechanics?.description ?? null}
      maxPoints={ctx.maxPoints}
      regions={ctx.regions}
    />
  );
}
