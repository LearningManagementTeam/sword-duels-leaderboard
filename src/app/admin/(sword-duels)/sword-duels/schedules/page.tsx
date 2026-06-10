import { SdAreaSchedulesEditor } from "@/components/sword-duels/admin/SdAreaSchedulesEditor";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { getSdAreaSchedules } from "@/lib/data/content-queries";
import { SWORD_DUELS_ADMIN } from "@/lib/admin-routes";
import { getSdAreaBrackets, getSdEvent } from "@/lib/products/sword-duels/queries";

export const dynamic = "force-dynamic";

export default async function SwordDuelsSchedulesPage() {
  const [schedules, event] = await Promise.all([
    getSdAreaSchedules(),
    getSdEvent(),
  ]);

  let areas: string[] = [];
  if (event) {
    try {
      const brackets = await getSdAreaBrackets(event.id);
      areas = brackets.map((b) => b.area);
    } catch {
      areas = Object.keys(schedules.byArea);
    }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
          { label: "Schedules" },
        ]}
      />
      <div className="sd-page-header">
        <h1>Area schedules</h1>
        <p>
          Set host/trainer names and Group A, Group B, and area final times per
          area. Names and schedules appear on the public Sword Duels leaderboard.
        </p>
      </div>
      <SdAreaSchedulesEditor
        areas={areas}
        initial={schedules}
        tournamentFormat={event?.tournament_format}
      />
    </div>
  );
}
