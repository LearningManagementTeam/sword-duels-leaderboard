export const EMPLOYEE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export type EmployeePhotoExt = "png" | "jpg" | "webp";

const EXT_TO_MIME: Record<EmployeePhotoExt, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export function mimeToEmployeePhotoExt(mime: string): EmployeePhotoExt | null {
  const normalized = mime === "image/jpg" ? "image/jpeg" : mime;
  if (normalized === "image/png") return "png";
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/webp") return "webp";
  return null;
}

export function employeePhotoExtFromName(name: string): EmployeePhotoExt | null {
  const match = name.toLowerCase().match(/\.(png|jpe?g|webp)$/);
  if (!match) return null;
  if (match[1] === "png") return "png";
  if (match[1] === "webp") return "webp";
  return "jpg";
}

export function detectEmployeePhotoExtFromBytes(
  bytes: Uint8Array
): EmployeePhotoExt | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export async function normalizeEmployeePhotoFile(
  file: File,
  label: string,
  source: string
): Promise<{ file: File; ext: EmployeePhotoExt; mime: string } | { error: string }> {
  if (file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (file.size > EMPLOYEE_PHOTO_MAX_BYTES) {
    return { error: "Photo must be 2MB or smaller." };
  }

  let ext =
    mimeToEmployeePhotoExt(file.type) ??
    employeePhotoExtFromName(file.name) ??
    detectEmployeePhotoExtFromBytes(
      new Uint8Array(await file.slice(0, 12).arrayBuffer())
    );

  if (!ext) {
    return { error: "Use PNG, JPG, or WebP." };
  }

  const mime = EXT_TO_MIME[ext];
  const normalized = new File([file], `${label}-${source}.${ext}`, { type: mime });
  return { file: normalized, ext, mime };
}
