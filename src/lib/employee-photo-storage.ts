const EMPLOYEE_PHOTO_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp)$/i;

export function isAllowedEmployeePhotoPath(path: string): boolean {
  return EMPLOYEE_PHOTO_PATH.test(path);
}

export function employeePhotoStoragePath(
  employeeId: string,
  ext: "png" | "jpg" | "webp"
): string {
  return `${employeeId}.${ext}`;
}

/** Public URL on this site — works when bucket is private. */
export function employeePhotoUrl(
  storagePath: string,
  cacheBust = Date.now()
): string {
  return `/api/hris/storage/${storagePath}?v=${cacheBust}`;
}

export function mimeForEmployeePhotoPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export function resolveEmployeePhotoUrl(
  photoPath: string | null | undefined
): string | null {
  if (!photoPath?.trim() || !isAllowedEmployeePhotoPath(photoPath.trim())) {
    return null;
  }
  return employeePhotoUrl(photoPath.trim());
}
