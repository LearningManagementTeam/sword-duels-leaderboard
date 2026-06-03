import { notFound } from "next/navigation";
import { RoundResultsForm } from "@/components/admin/RoundResultsForm";
import { getRoundWithResults } from "@/lib/data/admin-queries";

export default async function AdminRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoundWithResults(id);
  if (!data) notFound();

  return (
    <RoundResultsForm
      roundId={data.round.id}
      roundName={data.round.name}
      roundNumber={data.round.round_number}
      status={data.round.status}
      seasonSlug={data.seasonSlug}
      branches={data.branches}
      eliminatedBranches={data.eliminatedBranches}
      priorRoundNumber={data.priorRoundNumber}
      supportsManualAdvances={data.supportsManualAdvances}
      initial={data.resultMap}
    />
  );
}
