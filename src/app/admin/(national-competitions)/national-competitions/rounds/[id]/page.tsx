import { notFound } from "next/navigation";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { RoundResultsForm } from "@/components/admin/RoundResultsForm";
import { getRoundWithResults } from "@/lib/data/admin-queries";
import { seasonPhaseLabel } from "@/lib/season-labels";
import { nationalCompetitionsPath } from "@/lib/admin-routes";

export default async function AdminRoundPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoundWithResults(id);
  if (!data) notFound();

  const phaseLabel = seasonPhaseLabel(data.seasonSlug);
  const roundLabel = `${phaseLabel} — ${data.round.name}`;

  return (
    <div className="space-y-4">
      <AdminBreadcrumb
        items={[
          { label: "Rounds", href: nationalCompetitionsPath("rounds") },
          { label: roundLabel },
        ]}
      />
      <RoundResultsForm
        roundId={data.round.id}
        roundName={data.round.name}
        roundNumber={data.round.round_number}
        status={data.round.status}
        seasonSlug={data.seasonSlug}
        branches={data.branches}
        tieBreakerBranches={data.tieBreakerBranches}
        eliminatedBranches={data.eliminatedBranches}
        priorRoundNumber={data.priorRoundNumber}
        supportsManualAdvances={data.supportsManualAdvances}
        participantGateMessage={data.participantGateMessage}
        initial={data.resultMap}
      />
    </div>
  );
}
