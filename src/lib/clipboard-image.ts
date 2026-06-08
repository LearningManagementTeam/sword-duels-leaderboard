import { normalizeEmployeePhotoFile } from "@/lib/employee-photo-file";

function blobToFile(blob: Blob, label: string, source: string): File {
  const type = blob.type || "application/octet-stream";
  return new File([blob], `${label}-${source}`, { type });
}

/** Read image from a paste event (sync). */
export async function imageFileFromDataTransfer(
  data: DataTransfer | null,
  label: string
): Promise<File | null> {
  if (!data) return null;

  const candidates: File[] = [];

  for (const file of data.files) {
    if (file.type.startsWith("image/") || file.type === "") {
      candidates.push(file);
    }
  }

  for (const item of data.items) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (!file) continue;
    if (file.type.startsWith("image/") || file.type === "") {
      candidates.push(file);
    }
  }

  for (const file of candidates) {
    const result = await normalizeEmployeePhotoFile(file, label, "paste");
    if (!("error" in result)) return result.file;
  }

  return null;
}

/** Read image via async Clipboard API (needs user gesture). */
export async function imageFileFromClipboardApi(
  label: string
): Promise<File | null> {
  if (!navigator.clipboard?.read) return null;

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (!type.startsWith("image/")) continue;
        const blob = await item.getType(type);
        const file = blobToFile(blob, label, "paste");
        const result = await normalizeEmployeePhotoFile(file, label, "paste");
        if (!("error" in result)) return result.file;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function clipboardHasImage(data: DataTransfer | null): boolean {
  if (!data) return false;

  for (const item of data.items) {
    if (item.kind !== "file") continue;
    if (item.type.startsWith("image/") || item.type === "") return true;
  }

  for (const file of data.files) {
    if (file.type.startsWith("image/") || file.type === "") return true;
  }

  return false;
}

export function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('input:not([type="file"]), textarea, [contenteditable="true"]')
  );
}
