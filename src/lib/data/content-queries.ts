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

export async function getMechanicsContent(): Promise<MechanicsPublicBody> {
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
}
