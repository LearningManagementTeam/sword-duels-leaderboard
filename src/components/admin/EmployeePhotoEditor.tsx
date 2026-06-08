"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RepAvatar } from "@/components/ui/RepAvatar";
import {
  removeEmployeePhotoAction,
  uploadEmployeePhotoAction,
} from "@/lib/actions/admin";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";

interface Props {
  employeeId: string;
  name: string;
  photoPath: string | null;
  disabled?: boolean;
  onMessage: (message: string, error?: boolean) => void;
}

export function EmployeePhotoEditor({
  employeeId,
  name,
  photoPath,
  disabled = false,
  onMessage,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const photoUrl = resolveEmployeePhotoUrl(photoPath);

  async function handleFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    onMessage("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadEmployeePhotoAction(employeeId, formData);
      if (!result.ok) throw new Error(result.error);
      onMessage("Photo updated.");
      router.refresh();
    } catch (e) {
      onMessage(e instanceof Error ? e.message : "Upload failed.", true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setBusy(true);
    onMessage("");
    try {
      const result = await removeEmployeePhotoAction(employeeId);
      if (!result.ok) throw new Error(result.error);
      onMessage("Photo removed.");
      router.refresh();
    } catch (e) {
      onMessage(e instanceof Error ? e.message : "Remove failed.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <RepAvatar name={name} photoUrl={photoUrl} size="lg" />
      <div className="space-y-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={disabled || busy}
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {busy ? "Uploading…" : photoUrl ? "Replace photo" : "Upload photo"}
        </button>
        {photoUrl && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void handleRemove()}
            className="block text-xs text-rose-300/80 hover:text-rose-200 disabled:opacity-50"
          >
            Remove photo
          </button>
        )}
        <p className="text-[10px] text-sd-muted/70">PNG, JPG, or WebP · max 2 MB</p>
      </div>
    </div>
  );
}
