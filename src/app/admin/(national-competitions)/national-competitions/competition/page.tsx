import { CompetitionMapEditor } from "@/components/admin/CompetitionMapEditor";
import { SiteHomeEditor } from "@/components/admin/SiteHomeEditor";
import { getCompetitionMap, getSiteHomeConfig } from "@/lib/data/content-queries";
import { getRemainingContestantsForMap } from "@/lib/data/competition-map-queries";

export const dynamic = "force-dynamic";

export default async function AdminCompetitionPage() {
  const [config, homeConfig] = await Promise.all([
    getCompetitionMap(),
    getSiteHomeConfig(),
  ]);
  const remaining = await getRemainingContestantsForMap(config);

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Site home</h1>
        <p className="mt-1 text-sm text-sd-muted">
          Featured program hero and National Competitions season map on the
          public home page.
        </p>
      </div>
      <SiteHomeEditor initial={homeConfig} />
      <CompetitionMapEditor
        initial={config}
        initialRemaining={remaining}
      />
    </div>
  );
}
