import { CompetitionMapEditor } from "@/components/admin/CompetitionMapEditor";
import { EventScheduleEditor } from "@/components/admin/EventScheduleEditor";
import { NcPhaseSchedulesEditor } from "@/components/admin/NcPhaseSchedulesEditor";
import { SiteHomeEditor } from "@/components/admin/SiteHomeEditor";
import {
  getCompetitionMap,
  getEventSchedule,
  getNcPhaseSchedules,
  getSiteHomeConfig,
} from "@/lib/data/content-queries";
import { getRemainingContestantsForMap } from "@/lib/data/competition-map-queries";
import { getSdAreaBrackets, getSdEvent } from "@/lib/products/sword-duels/queries";

export const dynamic = "force-dynamic";

export default async function AdminCompetitionPage() {
  const [config, homeConfig, eventSchedule, ncPhaseSchedules] =
    await Promise.all([
      getCompetitionMap(),
      getSiteHomeConfig(),
      getEventSchedule(),
      getNcPhaseSchedules(),
    ]);
  const remaining = await getRemainingContestantsForMap(config);

  let sdAreas: string[] = [];
  const event = await getSdEvent();
  if (event) {
    try {
      const brackets = await getSdAreaBrackets(event.id);
      sdAreas = brackets.map((b) => b.area).sort();
    } catch {
      sdAreas = [];
    }
  }

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Site home</h1>
        <p className="mt-1 text-sm text-sd-muted">
          Featured program hero, event schedule, and National Competitions
          season map on the public home page.
        </p>
      </div>
      <SiteHomeEditor initial={homeConfig} />
      <EventScheduleEditor initial={eventSchedule} sdAreas={sdAreas} />
      <NcPhaseSchedulesEditor initial={ncPhaseSchedules} />
      <CompetitionMapEditor
        initial={config}
        initialRemaining={remaining}
      />
    </div>
  );
}
