import { CompetitionMapEditor } from "@/components/admin/CompetitionMapEditor";
import { getCompetitionMap } from "@/lib/data/content-queries";
import { getRemainingContestantsForMap } from "@/lib/data/competition-map-queries";

export const dynamic = "force-dynamic";

export default async function AdminCompetitionPage() {
  const config = await getCompetitionMap();
  const remaining = await getRemainingContestantsForMap(config);

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Competition map</h1>
        <p className="mt-1 text-sm text-sd-muted">
          Controls the live progress map on the public home page.
        </p>
      </div>
      <CompetitionMapEditor
        initial={config}
        initialRemaining={remaining}
      />
    </div>
  );
}
