import type { Metadata } from "next";
import { EventsCalendarInteractive } from "@/components/events-calendar/EventsCalendarInteractive";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { getEventsCalendar } from "@/lib/data/content-queries";
import {
  buildDefaultEventsCalendar2026,
  publishedCalendarEvents,
} from "@/lib/events-calendar";
import {
  buildSdPageMetadata,
} from "@/lib/products/sword-duels/share-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildSdPageMetadata({
    title: "Event calendar — Sword Duels",
    description:
      "Branch duels, area selections, and July battle dates — your quest map through Sword Duels season.",
    path: `${SWORD_DUELS_PUBLIC}/calendar`,
  });
}

export default async function SwordDuelsCalendarPublicPage() {
  const calendar = await getEventsCalendar();
  const source =
    calendar.events.length > 0 ? calendar : buildDefaultEventsCalendar2026();
  const events = publishedCalendarEvents(source);

  return (
    <div className="space-y-6">
      <header className="sd-page-header">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lime-300/80">
          Quest map
        </p>
        <h1>Event calendar</h1>
        <p>
          Tap a day to see prep blocks, branch duels, selections, and the road
          to the regional finale. Times are in Philippine time.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="sd-neon-panel p-6 text-center">
          <p className="text-sd-muted">
            The schedule has not been published yet. Check back soon.
          </p>
        </div>
      ) : (
        <EventsCalendarInteractive
          events={events}
          mode="public"
          initialMonth={{ year: 2026, month: 5 }}
        />
      )}

      <SwordDuelsPublicFooter />
    </div>
  );
}
