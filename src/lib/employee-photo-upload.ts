import { createServiceClient } from "@/lib/supabase/server";
import {
  employeePhotoStoragePath,
  employeePhotoUrl,
} from "@/lib/employee-photo-storage";
import { normalizeEmployeePhotoBuffer } from "@/lib/employee-photo-file";

async function removeEmployeePhotoFiles(
  service: Awaited<ReturnType<typeof createServiceClient>>,
  employeeId: string
) {
  const { error } = await service.storage
    .from("employee-photos")
    .remove([
      `${employeeId}.png`,
      `${employeeId}.jpg`,
      `${employeeId}.webp`,
    ]);
  if (error) {
    console.error("employee photo remove failed:", error.message);
  }
}

export async function persistEmployeePhotoUpload(
  employeeId: string,
  entry: Blob
): Promise<{ ok: true; photoUrl: string } | { ok: false; error: string }> {
  if (entry.size === 0) {
    return { ok: false, error: "Choose a photo to upload." };
  }

  const buffer = Buffer.from(await entry.arrayBuffer());
  const fileName = entry instanceof File ? entry.name : "upload";
  const normalized = normalizeEmployeePhotoBuffer(
    buffer,
    fileName,
    entry.type || ""
  );
  if ("error" in normalized) {
    return { ok: false, error: normalized.error };
  }

  const service = await createServiceClient();
  const path = employeePhotoStoragePath(employeeId, normalized.ext);
  await removeEmployeePhotoFiles(service, employeeId);

  const { error: uploadErr } = await service.storage
    .from("employee-photos")
    .upload(path, buffer, {
      contentType: normalized.mime,
      upsert: true,
    });
  if (uploadErr) {
    return { ok: false, error: uploadErr.message };
  }

  const now = new Date().toISOString();
  const { error } = await service
    .from("employees")
    .update({ photo_path: path, updated_at: now })
    .eq("id", employeeId);
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, photoUrl: employeePhotoUrl(path) };
}

export async function persistEmployeePhotoRemove(
  employeeId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = await createServiceClient();
  await removeEmployeePhotoFiles(service, employeeId);
  const now = new Date().toISOString();
  const { error } = await service
    .from("employees")
    .update({ photo_path: null, updated_at: now })
    .eq("id", employeeId);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
