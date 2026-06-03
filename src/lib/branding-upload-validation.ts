import { CAROUSEL_UPLOAD_SPECS, SPONSOR_LOGO_UPLOAD_SPECS } from "@/lib/branding";

export const LOGO_UPLOAD_SPECS = {
  maxBytes: 2 * 1024 * 1024,
  maxSizeLabel: "2 MB",
  accept: "image/png,image/jpeg,image/webp,image/svg+xml",
} as const;

export type BrandingFileIssue = "empty" | "too_large" | "wrong_type";

export type BrandingFileCheck =
  | { ok: true; fileName: string; sizeLabel: string }
  | {
      ok: false;
      issue: BrandingFileIssue;
      fileName: string;
      sizeLabel: string;
      message: string;
    };

export function formatFileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function checkImageType(
  file: File,
  acceptCsv: string,
  extraExtPattern: RegExp
): boolean {
  if (acceptCsv.split(",").includes(file.type)) return true;
  return extraExtPattern.test(file.name);
}

export function checkCarouselUploadFile(
  file: File | null | undefined
): BrandingFileCheck {
  if (!file || file.size === 0) {
    return {
      ok: false,
      issue: "empty",
      fileName: "",
      sizeLabel: "0 B",
      message: "Choose a photo file first.",
    };
  }

  const sizeLabel = formatFileSizeLabel(file.size);
  const fileName = file.name;

  if (file.size > CAROUSEL_UPLOAD_SPECS.maxBytes) {
    return {
      ok: false,
      issue: "too_large",
      fileName,
      sizeLabel,
      message: `This photo is ${sizeLabel}. The limit is ${CAROUSEL_UPLOAD_SPECS.maxSizeLabel}. Compress it (e.g. tinypng.com) and choose it again.`,
    };
  }

  if (
    !checkImageType(file, CAROUSEL_UPLOAD_SPECS.accept, /\.(jpe?g|png|webp)$/i)
  ) {
    return {
      ok: false,
      issue: "wrong_type",
      fileName,
      sizeLabel,
      message:
        "Use JPG, PNG, or WebP for carousel photos (export iPhone HEIC as JPEG if needed).",
    };
  }

  return { ok: true, fileName, sizeLabel };
}

export function checkLogoUploadFile(
  file: File | null | undefined
): BrandingFileCheck {
  if (!file || file.size === 0) {
    return {
      ok: false,
      issue: "empty",
      fileName: "",
      sizeLabel: "0 B",
      message: "Choose a logo file first.",
    };
  }

  const sizeLabel = formatFileSizeLabel(file.size);
  const fileName = file.name;

  if (file.size > LOGO_UPLOAD_SPECS.maxBytes) {
    return {
      ok: false,
      issue: "too_large",
      fileName,
      sizeLabel,
      message: `This logo is ${sizeLabel}. The limit is ${LOGO_UPLOAD_SPECS.maxSizeLabel}. Compress it and choose it again.`,
    };
  }

  if (
    !checkImageType(
      file,
      LOGO_UPLOAD_SPECS.accept,
      /\.(png|jpe?g|webp|svg)$/i
    )
  ) {
    return {
      ok: false,
      issue: "wrong_type",
      fileName,
      sizeLabel,
      message: "Use PNG, JPG, WebP, or SVG for the logo.",
    };
  }

  return { ok: true, fileName, sizeLabel };
}

export function checkSponsorLogoUploadFile(
  file: File | null | undefined
): BrandingFileCheck {
  if (!file || file.size === 0) {
    return {
      ok: false,
      issue: "empty",
      fileName: "",
      sizeLabel: "0 B",
      message: "Choose a logo file first.",
    };
  }

  const sizeLabel = formatFileSizeLabel(file.size);
  const fileName = file.name;

  if (file.size > SPONSOR_LOGO_UPLOAD_SPECS.maxBytes) {
    return {
      ok: false,
      issue: "too_large",
      fileName,
      sizeLabel,
      message: `This logo is ${sizeLabel}. The limit is ${SPONSOR_LOGO_UPLOAD_SPECS.maxSizeLabel}. Compress it and choose it again.`,
    };
  }

  if (
    !checkImageType(
      file,
      SPONSOR_LOGO_UPLOAD_SPECS.accept,
      /\.(png|jpe?g|webp|svg)$/i
    )
  ) {
    return {
      ok: false,
      issue: "wrong_type",
      fileName,
      sizeLabel,
      message: "Use PNG, JPG, WebP, or SVG for partner logos.",
    };
  }

  return { ok: true, fileName, sizeLabel };
}
