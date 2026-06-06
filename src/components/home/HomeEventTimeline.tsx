import Link from "next/link";
import {
  EVENT_SCHEDULE_PROGRAM_LABELS,
  formatScheduleDateTime,
} from "@/lib/event-schedule";
import type { HomeTimelineItem } from "@/lib/home-event-timeline";
import type { ResolvedFeaturedProgram } from "@/lib/site-home-config";

interface Props {
  upcoming: HomeTimelineItem[];
  recent: HomeTimelineItem[];
  featured: ResolvedFeaturedProgram;
}

const PROGRAM_CHIP: Record<
  HomeTimelineItem["program"],
  string
> = {
  sword_duels: "bg-cyan-400/15 text-cyan-100 ring-cyan-400/30",
  national_competitions: "bg-emerald-400/15 text-emerald-100 ring-emerald-400/30",
};

function sortFeaturedFirst(
  items: HomeTimelineItem[],
  featured: ResolvedFeaturedProgram
): HomeTimelineItem[] {
  return [...items].sort((a, b) => {
    const aFeatured = a.program === featured ? 0 : 1;
    const bFeatured = b.program === featured ? 0 : 1;
    if (aFeatured !== bFeatured) return aFeatured - bFeatured;
    return (
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  });
}

function sortUpcomingFeaturedFirst(
  items: HomeTimelineItem[],
  featured: ResolvedFeaturedProgram
): HomeTimelineItem[] {
  return [...items].sort((a, b) => {
    const aFeatured = a.program === featured ? 0 : 1;
    const bFeatured = b.program === featured ? 0 : 1;
    if (aFeatured !== bFeatured) return aFeatured - bFeatured;
    return (
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
  });
}

function TimelineList({
  items,
  emptyMessage,
}: {
  items: HomeTimelineItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-sd-muted/80">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-emerald-500/10">
      {items.map((item) => {
        const content = (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ring-inset ${PROGRAM_CHIP[item.program]}`}
                >
                  {EVENT_SCHEDULE_PROGRAM_LABELS[item.program]}
                </span>
                {item.source === "scheduled" && (
                  <span className="text-[9px] uppercase tracking-wider text-sd-muted/50">
                    Scheduled
                  </span>
                )}
              </div>
              <p className="mt-1 font-medium text-white">{item.title}</p>
              {item.detail && (
                <p className="mt-0.5 text-xs text-sd-muted/80">{item.detail}</p>
              )}
            </div>
            <time
              dateTime={item.occurredAt}
              className="shrink-0 text-right text-[11px] leading-snug text-sd-muted/70"
            >
              {formatScheduleDateTime(item.occurredAt)}
            </time>
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <Link
                href={item.href}
                className="flex items-start justify-between gap-3 px-4 py-3 text-sm transition hover:bg-emerald-500/5"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function HomeEventTimeline({ upcoming, recent, featured }: Props) {
  const upcomingSorted = sortUpcomingFeaturedFirst(upcoming, featured);
  const recentSorted = sortFeaturedFirst(recent, featured);

  if (upcomingSorted.length === 0 && recentSorted.length === 0) {
    return null;
  }

  return (
    <section className="sd-neon-panel mx-auto max-w-3xl overflow-hidden p-5">
      <h2 className="text-base font-semibold text-white">Event schedule</h2>
      <p className="mt-1 text-xs text-sd-muted">
        Upcoming dates from the committee plus recent results as they are
        published.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sd-inset overflow-hidden rounded-xl">
          <p className="border-b border-emerald-500/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-sd-glow/80">
            Upcoming
          </p>
          <TimelineList
            items={upcomingSorted}
            emptyMessage="No upcoming events scheduled yet."
          />
        </div>
        <div className="sd-inset overflow-hidden rounded-xl">
          <p className="border-b border-emerald-500/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-sd-glow/80">
            Recent results
          </p>
          <TimelineList
            items={recentSorted}
            emptyMessage="Results appear here when sets and rounds are published."
          />
        </div>
      </div>
    </section>
  );
}
