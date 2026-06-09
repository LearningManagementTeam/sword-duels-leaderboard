import {
  type EventScheduleConfig,
  type EventScheduleProgram,
  upcomingScheduleEntries,
} from "@/lib/event-schedule";
import {
  formatCalendarEventTitle,
  nextCalendarEvent,
  publishedCalendarEvents,
  type EventsCalendarConfig,
} from "@/lib/events-calendar";
import {
  upcomingFromNcPhaseSchedules,
  type NcPhaseSchedulesConfig,
} from "@/lib/nc-phase-schedules";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import {
  getLatestPublishedRoundInfo,
  getRoundsForSeason,
  getSeasonBySlug,
} from "@/lib/data/queries";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import { KNOCKOUT_ROUND_LABELS } from "@/lib/products/sword-duels/nationals-knockout-bracket";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import {
  upcomingFromSdAreaSchedules,
  type SdAreaSchedulesConfig,
} from "@/lib/products/sword-duels/area-schedules";
import { getSdPublicOverview } from "@/lib/products/sword-duels/public-queries";
import { getRecentAreaChampions } from "@/lib/products/sword-duels/recent-area-champions";
import { REGION_LABELS } from "@/lib/scoring-config";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { SD_REGIONAL_SET_LABELS } from "@/lib/products/sword-duels/regional-rounds";
import {
  getSdEvent,
  getSdSetsForEvent,
} from "@/lib/products/sword-duels/queries";
import type { SeasonSlug } from "@/lib/scoring-config";

export type HomeTimelineProgram = EventScheduleProgram;

export interface HomeTimelineItem {
  id: string;
  program: HomeTimelineProgram;
  title: string;
  detail?: string;
  occurredAt: string;
  href?: string;
  source: "scheduled" | "published";
}

function upcomingFromEventsCalendar(
  config: EventsCalendarConfig,
  now = Date.now(),
  limit = 16
): HomeTimelineItem[] {
  const macroOnly = publishedCalendarEvents(config).filter(
    (e) => !e.areas?.length
  );

  return macroOnly
    .filter((e) => {
      const end =
        e.endAt != null
          ? new Date(`${e.endAt}T23:59:59+08:00`).getTime()
          : new Date(
              e.startAt.length === 10
                ? `${e.startAt}T23:59:59+08:00`
                : e.startAt
            ).getTime();
      return end >= now;
    })
    .sort((a, b) => {
      const aStart = new Date(
        a.startAt.length === 10 ? `${a.startAt}T08:00:00+08:00` : a.startAt
      ).getTime();
      const bStart = new Date(
        b.startAt.length === 10 ? `${b.startAt}T08:00:00+08:00` : b.startAt
      ).getTime();
      return aStart - bStart;
    })
    .slice(0, limit)
    .map((event) => ({
      id: `calendar-${event.id}`,
      program: event.program,
      title: formatCalendarEventTitle(event),
      detail: event.timeLabel,
      occurredAt:
        event.startAt.length === 10
          ? `${event.startAt}T08:00:00+08:00`
          : event.startAt,
      href: `${SWORD_DUELS_PUBLIC}/calendar`,
      source: "scheduled" as const,
    }));
}

export { nextCalendarEvent };

function seasonPublicPath(slug: SeasonSlug): string {
  if (slug === "june_area") return "/june";
  if (slug === "july_region") return "/july";
  return "/august";
}

function seasonPhaseLabel(slug: SeasonSlug): string {
  if (slug === "june_area") return "June";
  if (slug === "july_region") return "July";
  return "The Nationals";
}

async function loadRecentNcItems(limit: number): Promise<HomeTimelineItem[]> {
  if (!isSupabaseConfigured()) return [];

  const slugs: SeasonSlug[] = ["june_area", "july_region", "august_finals"];
  const seasonById = new Map<string, SeasonSlug>();
  for (const slug of slugs) {
    const season = await getSeasonBySlug(slug);
    if (season) seasonById.set(season.id, slug);
  }
  const seasonIds = [...seasonById.keys()];
  if (seasonIds.length === 0) return [];

  const service = await createServiceClient();
  const { data, error } = await service
    .from("rounds")
    .select("round_number, name, published_at, season_id")
    .in("season_id", seasonIds)
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const items: HomeTimelineItem[] = [];
  for (const row of data) {
    const slug = seasonById.get(row.season_id as string);
    if (!slug || !row.published_at) continue;
    const phase = seasonPhaseLabel(slug);
    const roundName =
      typeof row.name === "string" && row.name.trim()
        ? row.name.trim()
        : `Round ${row.round_number}`;
    items.push({
      id: `nc-round-${slug}-${row.round_number}-${row.published_at}`,
      program: "national_competitions",
      title: `${phase} · ${roundName} published`,
      detail: "National Competitions standings updated",
      occurredAt: row.published_at as string,
      href: seasonPublicPath(slug),
      source: "published",
    });
  }
  return items;
}

async function loadRecentSdItems(limit: number): Promise<HomeTimelineItem[]> {
  if (!isSupabaseConfigured()) return [];

  const items: HomeTimelineItem[] = [];
  const overview = await getSdPublicOverview();
  if (overview) {
    const champions = getRecentAreaChampions(
      overview.brackets,
      overview.sets,
      overview.scoreMap,
      limit
    );
    for (const row of champions) {
      items.push({
        id: `sd-area-final-${row.area}-${row.publishedAt}`,
        program: "sword_duels",
        title: `${row.area} representative crowned`,
        detail: row.championName,
        occurredAt: row.publishedAt,
        href: `${SWORD_DUELS_PUBLIC}/${areaSlug(row.area)}`,
        source: "published",
      });
    }
  }

  const event = await getSdEvent();
  if (!event) {
    return items.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }

  const isV2 = isRegionalAverageFormat(event.tournament_format);

  if (isV2) {
    try {
      const sets = await getSdSetsForEvent(event.id);
      for (const set of sets) {
        if (
          !set.set_type.startsWith("regional_") ||
          set.status !== "published" ||
          !set.published_at
        ) {
          continue;
        }
        const label =
          SD_REGIONAL_SET_LABELS[
            set.set_type as keyof typeof SD_REGIONAL_SET_LABELS
          ] ?? set.set_type;
        items.push({
          id: `sd-regional-${set.id}-${set.published_at}`,
          program: "sword_duels",
          title: `${REGION_LABELS[set.area as keyof typeof REGION_LABELS] ?? set.area} · ${label} published`,
          detail: "Regional standings updated",
          occurredAt: set.published_at,
          href: `${SWORD_DUELS_PUBLIC}/regionals/${set.area}`,
          source: "published",
        });
      }

      const { loadKnockoutBracketState } = await import(
        "@/lib/products/sword-duels/knockout-sync"
      );
      const ko = await loadKnockoutBracketState(event.id);
      for (const match of ko.matches) {
        if (match.status !== "published" || !match.published_at) continue;
        items.push({
          id: `sd-finals-${match.id}`,
          program: "sword_duels",
          title: `${KNOCKOUT_ROUND_LABELS[match.round]} published`,
          detail: "National finals updated",
          occurredAt: match.published_at,
          href: `${SWORD_DUELS_PUBLIC}/nationals#knockout`,
          source: "published",
        });
      }
    } catch {
      /* tables optional */
    }
  } else {
    try {
      const ctx = await getSdNationalsContext(event.id);
      const wc = ctx.wildcardRound;
      if (
        wc?.status === "tiebreak_published" &&
        wc.published_at &&
        wc.winner_branch_id
      ) {
        items.push({
          id: `sd-wildcard-${wc.published_at}`,
          program: "sword_duels",
          title: "Wild card slot confirmed",
          detail: "Nationals field locked to 16",
          occurredAt: wc.published_at,
          href: `${SWORD_DUELS_PUBLIC}/nationals#wildcard`,
          source: "published",
        });
      }

      for (const match of ctx.knockoutMatches) {
        if (match.status !== "published" || !match.published_at) continue;
        items.push({
          id: `sd-knockout-${match.id}`,
          program: "sword_duels",
          title: `${KNOCKOUT_ROUND_LABELS[match.round]} match published`,
          detail: "Knockout bracket updated",
          occurredAt: match.published_at,
          href: `${SWORD_DUELS_PUBLIC}/nationals#knockout`,
          source: "published",
        });
      }
    } catch {
      /* nationals tables optional */
    }
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, limit);
}

export async function loadRecentTimelineItems(
  limit = 8
): Promise<HomeTimelineItem[]> {
  const [sd, nc] = await Promise.all([
    loadRecentSdItems(limit),
    loadRecentNcItems(limit),
  ]);

  return [...sd, ...nc]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, limit);
}

export function upcomingTimelineItems(
  schedule: EventScheduleConfig,
  limit = 8
): HomeTimelineItem[] {
  return upcomingScheduleEntries(schedule, Date.now(), limit).map((entry) => {
    let href: string | undefined;
    if (entry.program === "sword_duels") {
      href = entry.area
        ? `${SWORD_DUELS_PUBLIC}/${areaSlug(entry.area)}`
        : SWORD_DUELS_PUBLIC;
    } else {
      href = "/june";
    }

    return {
      id: `scheduled-${entry.id}`,
      program: entry.program,
      title: entry.title,
      detail: entry.area ? entry.area : undefined,
      occurredAt: entry.scheduledAt,
      href,
      source: "scheduled",
    };
  });
}

const RECENT_PAST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function pastScheduleToRecentItems(
  config: EventScheduleConfig,
  now = Date.now()
): HomeTimelineItem[] {
  const floor = now - RECENT_PAST_WINDOW_MS;

  return config.entries
    .filter((e) => {
      const t = new Date(e.scheduledAt).getTime();
      return t <= now && t >= floor;
    })
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    )
    .map((entry) => {
      let href = "/june";
      if (entry.program === "sword_duels") {
        href = entry.area
          ? `${SWORD_DUELS_PUBLIC}/${areaSlug(entry.area)}`
          : SWORD_DUELS_PUBLIC;
      }
      return {
        id: `past-scheduled-${entry.id}`,
        program: entry.program,
        title: entry.title,
        detail: "Scheduled time passed — publish results when ready",
        occurredAt: entry.scheduledAt,
        href,
        source: "scheduled" as const,
      };
    });
}

async function loadPublishedNcRoundsMap(): Promise<
  Map<SeasonSlug, Set<number>>
> {
  const map = new Map<SeasonSlug, Set<number>>();
  if (!isSupabaseConfigured()) return map;

  const slugs: SeasonSlug[] = ["june_area", "july_region", "august_finals"];
  for (const slug of slugs) {
    const season = await getSeasonBySlug(slug);
    if (!season) continue;
    const rounds = await getRoundsForSeason(season.id);
    const published = new Set(
      rounds
        .filter((r) => r.status === "published")
        .map((r) => r.round_number)
    );
    map.set(slug, published);
  }
  return map;
}

function mergeTimelineItems(
  items: HomeTimelineItem[],
  limit: number,
  sortAsc: boolean
): HomeTimelineItem[] {
  const seen = new Set<string>();
  const merged: HomeTimelineItem[] = [];

  const sorted = [...items].sort((a, b) => {
    const diff =
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    return sortAsc ? diff : -diff;
  });

  for (const item of sorted) {
    const key = `${item.program}:${item.title}:${item.occurredAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
}

export async function loadHomeEventTimeline(
  schedule: EventScheduleConfig,
  sdAreaSchedules?: SdAreaSchedulesConfig,
  ncPhaseSchedules?: NcPhaseSchedulesConfig,
  eventsCalendar?: EventsCalendarConfig
): Promise<{
  upcoming: HomeTimelineItem[];
  recent: HomeTimelineItem[];
}> {
  const overview = isSupabaseConfigured()
    ? await getSdPublicOverview()
    : null;

  const event = isSupabaseConfigured() ? await getSdEvent() : null;

  const fromAreas =
    sdAreaSchedules && overview
      ? upcomingFromSdAreaSchedules(
          sdAreaSchedules,
          overview.sets,
          event?.tournament_format
        )
      : [];

  const [recentPublished, manualUpcoming, publishedNcRounds] =
    await Promise.all([
      loadRecentTimelineItems(16),
      Promise.resolve(upcomingTimelineItems(schedule, 16)),
      loadPublishedNcRoundsMap(),
    ]);

  const fromNc = ncPhaseSchedules
    ? upcomingFromNcPhaseSchedules(ncPhaseSchedules, publishedNcRounds)
    : [];

  const pastScheduled = pastScheduleToRecentItems(schedule);

  const fromCalendar = eventsCalendar
    ? upcomingFromEventsCalendar(eventsCalendar)
    : [];

  return {
    upcoming: mergeTimelineItems(
      [...manualUpcoming, ...fromAreas, ...fromNc, ...fromCalendar],
      8,
      true
    ),
    recent: mergeTimelineItems(
      [...recentPublished, ...pastScheduled],
      8,
      false
    ),
  };
}

/** One-line NC status from latest publish when no schedule rows exist. */
export async function ncLatestPublishLine(): Promise<string | null> {
  const info = await getLatestPublishedRoundInfo();
  if (!info) return null;
  const phase = seasonPhaseLabel(info.seasonSlug);
  return `${phase} Round ${info.roundNumber} · last updated ${new Date(info.publishedAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}`;
}
