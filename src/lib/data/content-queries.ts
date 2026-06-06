import { cache } from "react";
import {
  BRANDING_CONTENT_SLUG,
  DEFAULT_BRANDING,
  parseBrandingBody,
  type BrandingConfig,
} from "@/lib/branding";
import {
  COMPETITION_MAP_SLUG,
  DEFAULT_COMPETITION_MAP_CONFIG,
  parseCompetitionMapBody,
  type CompetitionMapConfig,
} from "@/lib/competition-map";
import {
  DEFAULT_MECHANICS_BODY,
  MECHANICS_CONTENT_SLUG,
  parseMechanicsBody,
  type MechanicsPublicBody,
} from "@/lib/mechanics-content";
import {
  DEFAULT_EVENT_SCHEDULE,
  EVENT_SCHEDULE_SLUG,
  parseEventScheduleBody,
  type EventScheduleConfig,
} from "@/lib/event-schedule";
import {
  DEFAULT_SD_AREA_SCHEDULES,
  parseSdAreaSchedulesBody,
  SD_AREA_SCHEDULES_SLUG,
  type SdAreaSchedulesConfig,
} from "@/lib/products/sword-duels/area-schedules";
import {
  DEFAULT_NC_PHASE_SCHEDULES,
  NC_PHASE_SCHEDULES_SLUG,
  parseNcPhaseSchedulesBody,
  type NcPhaseSchedulesConfig,
} from "@/lib/nc-phase-schedules";
import {
  DEFAULT_SITE_HOME_CONFIG,
  parseSiteHomeConfigBody,
  SITE_HOME_CONFIG_SLUG,
  type SiteHomeConfig,
} from "@/lib/site-home-config";
import {
  createServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/server";

export const getMechanicsContent = cache(async (): Promise<MechanicsPublicBody> => {
  if (!isSupabaseServiceConfigured()) {
    return { ...DEFAULT_MECHANICS_BODY };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("site_content")
    .select("body")
    .eq("slug", MECHANICS_CONTENT_SLUG)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_MECHANICS_BODY };
  return parseMechanicsBody(data.body);
});

export const getBranding = cache(async (): Promise<BrandingConfig> => {
  if (!isSupabaseServiceConfigured()) {
    return { ...DEFAULT_BRANDING };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("site_content")
    .select("body")
    .eq("slug", BRANDING_CONTENT_SLUG)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_BRANDING };
  return parseBrandingBody(data.body);
});

export const getCompetitionMap = cache(async (): Promise<CompetitionMapConfig> => {
  if (!isSupabaseServiceConfigured()) {
    return { ...DEFAULT_COMPETITION_MAP_CONFIG };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("site_content")
    .select("body")
    .eq("slug", COMPETITION_MAP_SLUG)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_COMPETITION_MAP_CONFIG };
  return parseCompetitionMapBody(data.body);
});

export const getSiteHomeConfig = cache(async (): Promise<SiteHomeConfig> => {
  if (!isSupabaseServiceConfigured()) {
    return { ...DEFAULT_SITE_HOME_CONFIG };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("site_content")
    .select("body")
    .eq("slug", SITE_HOME_CONFIG_SLUG)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_SITE_HOME_CONFIG };
  return parseSiteHomeConfigBody(data.body);
});

export const getEventSchedule = cache(async (): Promise<EventScheduleConfig> => {
  if (!isSupabaseServiceConfigured()) {
    return { ...DEFAULT_EVENT_SCHEDULE };
  }
  const service = await createServiceClient();
  const { data, error } = await service
    .from("site_content")
    .select("body")
    .eq("slug", EVENT_SCHEDULE_SLUG)
    .maybeSingle();

  if (error || !data) return { ...DEFAULT_EVENT_SCHEDULE };
  return parseEventScheduleBody(data.body);
});

export const getSdAreaSchedules = cache(
  async (): Promise<SdAreaSchedulesConfig> => {
    if (!isSupabaseServiceConfigured()) {
      return { ...DEFAULT_SD_AREA_SCHEDULES };
    }
    const service = await createServiceClient();
    const { data, error } = await service
      .from("site_content")
      .select("body")
      .eq("slug", SD_AREA_SCHEDULES_SLUG)
      .maybeSingle();

    if (error || !data) return { ...DEFAULT_SD_AREA_SCHEDULES };
    return parseSdAreaSchedulesBody(data.body);
  }
);

export const getNcPhaseSchedules = cache(
  async (): Promise<NcPhaseSchedulesConfig> => {
    if (!isSupabaseServiceConfigured()) {
      return { ...DEFAULT_NC_PHASE_SCHEDULES };
    }
    const service = await createServiceClient();
    const { data, error } = await service
      .from("site_content")
      .select("body")
      .eq("slug", NC_PHASE_SCHEDULES_SLUG)
      .maybeSingle();

    if (error || !data) return { ...DEFAULT_NC_PHASE_SCHEDULES };
    return parseNcPhaseSchedulesBody(data.body);
  }
);
