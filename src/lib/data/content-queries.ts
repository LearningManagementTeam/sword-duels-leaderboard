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
