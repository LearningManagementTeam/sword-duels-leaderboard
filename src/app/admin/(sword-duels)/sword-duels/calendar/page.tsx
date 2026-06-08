import { EventsCalendarEditor } from "@/components/admin/EventsCalendarEditor";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { getEventsCalendar } from "@/lib/data/content-queries";
import { SWORD_DUELS_ADMIN } from "@/lib/admin-routes";
import { buildDefaultEventsCalendar2026 } from "@/lib/events-calendar";
import { getSdAreaBrackets, getSdEvent } from "@/lib/products/sword-duels/queries";

export const dynamic = "force-dynamic";

export default async function SwordDuelsCalendarPage() {
  const calendar = await getEventsCalendar();
  const initial =
    calendar.events.length > 0 ? calendar : buildDefaultEventsCalendar2026();

  let areas: string[] = [];
  try {
    const event = await getSdEvent();
    if (event) {
      const brackets = await getSdAreaBrackets(event.id);
      areas = brackets.map((b) => b.area);
    }
  } catch {
    areas = Array.from({ length: 15 }, (_, i) => `Area ${i + 1}`);
  }

  if (areas.length === 0) {
    areas = Array.from({ length: 15 }, (_, i) => `Area ${i + 1}`);
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
          { label: "Calendar" },
        ]}
      />
      <div className="sd-page-header">
        <h1>Events calendar</h1>
        <p>
          Interactive schedule for branch duels, selections, and July area
          battles. Fans see published entries on the public calendar.
        </p>
      </div>
      <EventsCalendarEditor initial={initial} areas={areas} />
    </div>
  );
}
