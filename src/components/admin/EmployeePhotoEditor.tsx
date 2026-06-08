"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RepAvatar } from "@/components/ui/RepAvatar";
import {
  removeEmployeePhotoAction,
  uploadEmployeePhotoAction,
} from "@/lib/actions/admin";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

interface Props {
  employeeId: string;
  name: string;
  photoPath: string | null;
  disabled?: boolean;
  onMessage: (message: string, error?: boolean) => void;
}

function normalizeImageFile(file: File, employeeId: string, source: string): File {
  let type = file.type;
  if (type === "image/jpg") type = "image/jpeg";
  if (!ACCEPTED_TYPES.has(type)) {
    type = "image/png";
  }
  const ext =
    type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
  return new File([file], `${employeeId}-${source}.${ext}`, { type });
}

function imageFromClipboard(
  data: DataTransfer | null,
  employeeId: string
): File | null {
  if (!data) return null;

  for (const item of data.items) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const blob = item.getAsFile();
    if (!blob) continue;
    return normalizeImageFile(blob, employeeId, "paste");
  }

  return null;
}

function validatePhotoFile(file: File): string | null {
  if (file.size === 0) return "Choose a photo to upload.";
  if (file.size > MAX_BYTES) return "Photo must be 2MB or smaller.";
  const type = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!ACCEPTED_TYPES.has(type)) return "Use PNG, JPG, or WebP.";
  return null;
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
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [pasteFocused, setPasteFocused] = useState(false);
  const photoUrl = resolveEmployeePhotoUrl(photoPath);

  async function handleFile(file: File | null, source: "upload" | "paste") {
    if (!file) return;

    const normalized = normalizeImageFile(file, employeeId, source);
    const validationError = validatePhotoFile(normalized);
    if (validationError) {
      onMessage(validationError, true);
      return;
    }

    setBusy(true);
    onMessage("");
    try {
      const formData = new FormData();
      formData.set("file", normalized);
      const result = await uploadEmployeePhotoAction(employeeId, formData);
      if (!result.ok) throw new Error(result.error);
      onMessage(source === "paste" ? "Photo pasted." : "Photo updated.");
      router.refresh();
    } catch (e) {
      onMessage(e instanceof Error ? e.message : "Upload failed.", true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (disabled || busy) return;
    const file = imageFromClipboard(e.clipboardData, employeeId);
    if (!file) return;
    e.preventDefault();
    void handleFile(file, "paste");
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

  const inactive = disabled || busy;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        ref={pasteZoneRef}
        tabIndex={inactive ? -1 : 0}
        role="button"
        aria-label={`Photo for ${name}. Click to focus, then paste an image from the clipboard.`}
        onPaste={handlePaste}
        onFocus={() => setPasteFocused(true)}
        onBlur={() => setPasteFocused(false)}
        className={`rounded-xl outline-none transition ${
          pasteFocused
            ? "ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-sd-deep"
            : "ring-1 ring-transparent"
        } ${inactive ? "opacity-60" : "cursor-pointer"}`}
      >
        <RepAvatar name={name} photoUrl={photoUrl} size="lg" />
      </div>
      <div className="space-y-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={inactive}
          onChange={(e) =>
            void handleFile(e.target.files?.[0] ?? null, "upload")
          }
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={inactive}
            onClick={() => inputRef.current?.click()}
            className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
          >
            {busy ? "Uploading…" : photoUrl ? "Replace photo" : "Upload photo"}
          </button>
          <button
            type="button"
            disabled={inactive}
            onClick={() => pasteZoneRef.current?.focus()}
            className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Paste photo
          </button>
        </div>
        {photoUrl && (
          <button
            type="button"
            disabled={inactive}
            onClick={() => void handleRemove()}
            className="block text-xs text-rose-300/80 hover:text-rose-200 disabled:opacity-50"
          >
            Remove photo
          </button>
        )}
        <p className="text-[10px] text-sd-muted/70">
          PNG, JPG, or WebP · max 2 MB · click avatar or Paste photo, then
          Ctrl+V / ⌘V
        </p>
      </div>
    </div>
  );
}
