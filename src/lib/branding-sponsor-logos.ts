import {
  BRANDING_CONTENT_SLUG,
  DEFAULT_BRANDING,
  finalizeBrandingConfig,
  parseBrandingBody,
  setSponsorLogoUrl,
  SPONSOR_LOGO_UPLOAD_SPECS,
  type BrandingConfig,
  type SponsorLogoSlides,
  type SponsorLogoSlot,
} from "@/lib/branding";
import { brandingAssetUrl } from "@/lib/branding-storage";
import { revalidateBrandingPublicPaths } from "@/lib/branding-revalidate";
import { createServiceClient } from "@/lib/supabase/server";

import { checkSponsorLogoUploadFile } from "@/lib/branding-upload-validation";

export const SPONSOR_LOGO_MAX_BYTES = SPONSOR_LOGO_UPLOAD_SPECS.maxBytes;

const SPONSOR_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const SPONSOR_EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export type { SponsorLogoSlot } from "@/lib/branding";

export type SponsorLogoMutationResult = {
  ok: true;
  slot: SponsorLogoSlot;
  url: string | null;
  sponsor_logos: SponsorLogoSlides;
};

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

export function parseSponsorLogoSlot(
  raw: FormDataEntryValue | null
): SponsorLogoSlot {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3) return n;
  throw new Error("Invalid sponsor logo slot (use 1, 2, or 3).");
}

function sponsorFileExtension(file: File): string | undefined {
  const fromMime = SPONSOR_MIME[file.type];
  if (fromMime) return fromMime;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".svg")) return "svg";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  return undefined;
}

function sponsorContentType(file: File, ext: string): string {
  if (file.type && SPONSOR_MIME[file.type]) return file.type;
  return SPONSOR_EXT_MIME[ext] ?? "image/png";
}

async function removeBrandingStorageFiles(
  service: ServiceClient,
  prefix: string
) {
  const { data: list } = await service.storage.from("branding").list("", {
    limit: 30,
  });
  const toRemove =
    list?.filter((o) => o.name.startsWith(prefix)).map((o) => o.name) ?? [];
  if (toRemove.length) {
    await service.storage.from("branding").remove(toRemove);
  }
}

async function upsertBrandingBody(
  service: ServiceClient,
  email: string,
  patch: Partial<BrandingConfig>
) {
  const { data: existing } = await service
    .from("site_content")
    .select("body")
    .eq("slug", BRANDING_CONTENT_SLUG)
    .maybeSingle();

  const current = existing?.body
    ? parseBrandingBody(existing.body)
    : { ...DEFAULT_BRANDING };

  const body: BrandingConfig = finalizeBrandingConfig({
    logo_url: patch.logo_url !== undefined ? patch.logo_url : current.logo_url,
    logo_alt: patch.logo_alt ?? current.logo_alt ?? DEFAULT_BRANDING.logo_alt,
    carousel_slides:
      patch.carousel_slides !== undefined
        ? patch.carousel_slides
        : current.carousel_slides,
    sponsor_logos:
      patch.sponsor_logos !== undefined
        ? patch.sponsor_logos
        : current.sponsor_logos,
  });

  const { error } = await service.from("site_content").upsert(
    {
      slug: BRANDING_CONTENT_SLUG,
      body,
      updated_at: new Date().toISOString(),
      updated_by_email: email,
    },
    { onConflict: "slug" }
  );
  if (error) throw new Error(error.message);
  return body;
}

export async function uploadSponsorLogoFile(
  email: string,
  slot: SponsorLogoSlot,
  file: File
): Promise<SponsorLogoMutationResult> {
  const check = checkSponsorLogoUploadFile(file);
  if (!check.ok) {
    throw new Error(check.message);
  }

  const ext = sponsorFileExtension(file);
  if (!ext) {
    throw new Error("Use PNG, JPG, WebP, or SVG for partner logos.");
  }

  const service = await createServiceClient();
  const path = `sponsor-logo-${slot}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await removeBrandingStorageFiles(service, `sponsor-logo-${slot}.`);

  const { error: uploadErr } = await service.storage
    .from("branding")
    .upload(path, buffer, {
      contentType: sponsorContentType(file, ext),
      upsert: true,
      cacheControl: "3600",
    });
  if (uploadErr) throw new Error(uploadErr.message);

  const url = brandingAssetUrl(path);

  const { data: existing } = await service
    .from("site_content")
    .select("body")
    .eq("slug", BRANDING_CONTENT_SLUG)
    .maybeSingle();
  const current = existing?.body
    ? parseBrandingBody(existing.body)
    : { ...DEFAULT_BRANDING };
  const logos = setSponsorLogoUrl(current.sponsor_logos, slot, url);

  await upsertBrandingBody(service, email, { sponsor_logos: logos });
  revalidateBrandingPublicPaths();

  return { ok: true, slot, url, sponsor_logos: logos };
}

export async function removeSponsorLogoSlot(
  email: string,
  slot: SponsorLogoSlot
): Promise<SponsorLogoMutationResult> {
  const service = await createServiceClient();

  await removeBrandingStorageFiles(service, `sponsor-logo-${slot}.`);

  const { data: existing } = await service
    .from("site_content")
    .select("body")
    .eq("slug", BRANDING_CONTENT_SLUG)
    .maybeSingle();
  const current = existing?.body
    ? parseBrandingBody(existing.body)
    : { ...DEFAULT_BRANDING };
  const logos = setSponsorLogoUrl(current.sponsor_logos, slot, null);

  await upsertBrandingBody(service, email, { sponsor_logos: logos });
  revalidateBrandingPublicPaths();

  return { ok: true, slot, url: null, sponsor_logos: logos };
}
