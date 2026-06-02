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
      status={data.round.status}
      branches={data.branches}
      initial={data.resultMap}
    />
  );
}
