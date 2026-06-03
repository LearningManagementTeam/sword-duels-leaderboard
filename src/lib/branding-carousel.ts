import {
  BRANDING_CONTENT_SLUG,
  CAROUSEL_UPLOAD_SPECS,
  DEFAULT_BRANDING,
  parseBrandingBody,
  type BrandingConfig,
  type CarouselSlides,
} from "@/lib/branding";
import { brandingAssetUrl } from "@/lib/branding-storage";
import { createServiceClient } from "@/lib/supabase/server";

import { checkCarouselUploadFile } from "@/lib/branding-upload-validation";

export const CAROUSEL_MAX_BYTES = CAROUSEL_UPLOAD_SPECS.maxBytes;

const CAROUSEL_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const CAROUSEL_EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export type CarouselSlot = 1 | 2 | 3;

export type CarouselMutationResult = {
  ok: true;
  slot: CarouselSlot;
  url: string | null;
  carousel_slides: CarouselSlides;
};

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

export function parseCarouselSlot(raw: FormDataEntryValue | null): CarouselSlot {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3) return n;
  throw new Error("Invalid carousel slot (use 1, 2, or 3).");
}

function carouselFileExtension(file: File): string | undefined {
  const fromMime = CAROUSEL_MIME[file.type];
  if (fromMime) return fromMime;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  return undefined;
}

function carouselContentType(file: File, ext: string): string {
  if (file.type && CAROUSEL_MIME[file.type]) return file.type;
  return CAROUSEL_EXT_MIME[ext] ?? "image/jpeg";
}

async function removeBrandingStorageFiles(
  service: ServiceClient,
  prefix: string
) {
  const { data: list } = await service.storage.from("branding").list("", {
    limit: 20,
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

  const body: BrandingConfig = {
    logo_url: patch.logo_url !== undefined ? patch.logo_url : current.logo_url,
    logo_alt: patch.logo_alt ?? current.logo_alt ?? DEFAULT_BRANDING.logo_alt,
    carousel_slides:
      patch.carousel_slides !== undefined
        ? patch.carousel_slides
        : current.carousel_slides,
  };

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

export async function uploadCarouselSlideFile(
  email: string,
  slot: CarouselSlot,
  file: File
): Promise<CarouselMutationResult> {
  const check = checkCarouselUploadFile(file);
  if (!check.ok) {
    throw new Error(check.message);
  }

  const ext = carouselFileExtension(file);
  if (!ext) {
    throw new Error(
      "Use JPG, PNG, or WebP (export iPhone HEIC as JPEG first)."
    );
  }

  const service = await createServiceClient();
  const path = `carousel-${slot}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await removeBrandingStorageFiles(service, `carousel-${slot}.`);

  const { error: uploadErr } = await service.storage
    .from("branding")
    .upload(path, buffer, {
      contentType: carouselContentType(file, ext),
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
  const slides = [...current.carousel_slides] as CarouselSlides;
  slides[slot - 1] = url;

  await upsertBrandingBody(service, email, { carousel_slides: slides });

  return { ok: true, slot, url, carousel_slides: slides };
}

export async function removeCarouselSlideSlot(
  email: string,
  slot: CarouselSlot
): Promise<CarouselMutationResult> {
  const service = await createServiceClient();

  await removeBrandingStorageFiles(service, `carousel-${slot}.`);

  const { data: existing } = await service
    .from("site_content")
    .select("body")
    .eq("slug", BRANDING_CONTENT_SLUG)
    .maybeSingle();
  const current = existing?.body
    ? parseBrandingBody(existing.body)
    : { ...DEFAULT_BRANDING };
  const slides = [...current.carousel_slides] as CarouselSlides;
  slides[slot - 1] = null;

  await upsertBrandingBody(service, email, { carousel_slides: slides });

  return { ok: true, slot, url: null, carousel_slides: slides };
}
