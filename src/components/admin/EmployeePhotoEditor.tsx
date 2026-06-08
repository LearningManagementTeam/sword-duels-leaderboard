"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { RepAvatar } from "@/components/ui/RepAvatar";
import {
  removeEmployeePhotoAction,
  uploadEmployeePhotoAction,
} from "@/lib/actions/admin";
import {
  imageFileFromClipboardApi,
  imageFileFromDataTransfer,
  isEditablePasteTarget,
} from "@/lib/clipboard-image";
import { resolveEmployeePhotoUrl } from "@/lib/employee-photo-storage";
import { normalizeEmployeePhotoFile } from "@/lib/employee-photo-file";

type PhotoStatus = "idle" | "reading" | "uploading" | "removing" | "success" | "error";

type CommonProps = {
  name: string;
  disabled?: boolean;
  onMessage: (message: string, error?: boolean) => void;
};

type SavedProps = CommonProps & {
  employeeId: string;
  photoPath: string | null;
  draftFile?: never;
  onDraftFileChange?: never;
};

type DraftProps = CommonProps & {
  employeeId?: never;
  photoPath?: never;
  draftFile: File | null;
  onDraftFileChange: (file: File | null) => void;
};

type Props = SavedProps | DraftProps;

export function EmployeePhotoEditor(props: Props) {
  const { name, disabled = false, onMessage } = props;
  const isDraft = !("employeeId" in props && props.employeeId);

  const router = useRouter();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [pasteFocused, setPasteFocused] = useState(false);
  const [status, setStatus] = useState<PhotoStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const savedPhotoUrl = !isDraft
    ? resolveEmployeePhotoUrl(props.photoPath)
    : null;
  const draftPreviewUrl = useMemo(() => {
    if (!isDraft || !props.draftFile) return null;
    return URL.createObjectURL(props.draftFile);
  }, [isDraft, isDraft ? props.draftFile : null]);

  useEffect(() => {
    return () => {
      if (draftPreviewUrl) URL.revokeObjectURL(draftPreviewUrl);
    };
  }, [draftPreviewUrl]);

  const photoUrl = isDraft ? draftPreviewUrl : savedPhotoUrl;
  const fileLabel = isDraft ? "new-employee" : props.employeeId;

  const setFeedback = useCallback(
    (message: string, nextStatus: PhotoStatus, error = false) => {
      setStatus(nextStatus);
      setStatusMessage(message);
      onMessage(message, error);
    },
    [onMessage]
  );

  const clearFeedback = useCallback(() => {
    setStatus("idle");
    setStatusMessage("");
    onMessage("");
  }, [onMessage]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => {
      setStatus("idle");
      setStatusMessage("");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const onDraftFileChange = isDraft ? props.onDraftFileChange : undefined;
  const savedEmployeeId = !isDraft ? props.employeeId : undefined;

  const applyFile = useCallback(
    async (rawFile: File, source: "upload" | "paste") => {
      const result = await normalizeEmployeePhotoFile(rawFile, fileLabel, source);
      if ("error" in result) {
        setFeedback(result.error, "error", true);
        return;
      }

      if (isDraft && onDraftFileChange) {
        onDraftFileChange(result.file);
        setFeedback(
          source === "paste"
            ? "Photo pasted — it will save when you create the employee."
            : "Photo selected — it will save when you create the employee.",
          "success"
        );
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      if (!savedEmployeeId) return;

      setBusy(true);
      setFeedback("Uploading photo…", "uploading");
      try {
        const formData = new FormData();
        formData.set("file", result.file);
        const upload = await uploadEmployeePhotoAction(savedEmployeeId, formData);
        if (!upload.ok) throw new Error(upload.error);
        setFeedback(
          source === "paste" ? "Photo pasted and saved." : "Photo uploaded.",
          "success"
        );
        startTransition(() => router.refresh());
      } catch (e) {
        setFeedback(
          e instanceof Error ? e.message : "Upload failed.",
          "error",
          true
        );
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [fileLabel, isDraft, onDraftFileChange, router, savedEmployeeId, setFeedback, startTransition]
  );

  const applyFileRef = useRef(applyFile);
  applyFileRef.current = applyFile;

  const handlePasteFromEvent = useCallback(
    async (data: DataTransfer | null) => {
      if (disabled || busy) return false;

      setFeedback("Reading clipboard…", "reading");
      const file = await imageFileFromDataTransfer(data, fileLabel);
      if (!file) {
        setFeedback(
          "No image on clipboard. Copy a screenshot or image first, then try again.",
          "error",
          true
        );
        return false;
      }

      await applyFileRef.current(file, "paste");
      return true;
    },
    [busy, disabled, fileLabel, setFeedback]
  );

  useEffect(() => {
    if (disabled) return;

    function onWindowPaste(e: ClipboardEvent) {
      if (isEditablePasteTarget(e.target)) return;
      void handlePasteFromEvent(e.clipboardData).then((handled) => {
        if (handled) e.preventDefault();
      });
    }

    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [disabled, handlePasteFromEvent]);

  function handleFileInput(file: File | null) {
    if (!file) return;
    void applyFile(file, "upload");
  }

  function handlePasteOnZone(e: React.ClipboardEvent) {
    e.preventDefault();
    void handlePasteFromEvent(e.clipboardData);
  }

  async function handlePasteButton() {
    if (disabled || busy) return;

    setFeedback("Reading clipboard…", "reading");
    const file = await imageFileFromClipboardApi(fileLabel);
    if (file) {
      await applyFile(file, "paste");
      return;
    }

    pasteZoneRef.current?.focus();
    setFeedback(
      "Press Ctrl+V / ⌘V to paste your copied image.",
      "reading"
    );
  }

  function handleRemove() {
    if (isDraft && props.onDraftFileChange) {
      props.onDraftFileChange(null);
      setFeedback("Photo removed.", "success");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setBusy(true);
    setFeedback("Removing photo…", "removing");
    void (async () => {
      try {
        const result = await removeEmployeePhotoAction(props.employeeId);
        if (!result.ok) throw new Error(result.error);
        setFeedback("Photo removed.", "success");
        startTransition(() => router.refresh());
      } catch (e) {
        setFeedback(
          e instanceof Error ? e.message : "Remove failed.",
          "error",
          true
        );
      } finally {
        setBusy(false);
      }
    })();
  }

  const inactive = disabled || busy;
  const showStatus = status !== "idle" && statusMessage;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div
          ref={pasteZoneRef}
          tabIndex={inactive ? -1 : 0}
          role="button"
          aria-label={`Photo for ${name}. Paste an image with Ctrl+V or ⌘V.`}
          onPaste={handlePasteOnZone}
          onFocus={() => setPasteFocused(true)}
          onBlur={() => setPasteFocused(false)}
          onClick={() => {
            if (!inactive) pasteZoneRef.current?.focus();
          }}
          className={`rounded-xl outline-none transition ${
            pasteFocused || status === "reading"
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
            onChange={(e) => {
              handleFileInput(e.target.files?.[0] ?? null);
              clearFeedback();
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={inactive}
              onClick={() => {
                clearFeedback();
                inputRef.current?.click();
              }}
              className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {status === "uploading"
                ? "Uploading…"
                : photoUrl
                  ? "Replace photo"
                  : "Upload photo"}
            </button>
            <button
              type="button"
              disabled={inactive}
              onClick={() => void handlePasteButton()}
              className="sd-btn-ghost rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
            >
              {status === "reading" ? "Reading…" : "Paste photo"}
            </button>
          </div>
          {photoUrl && (
            <button
              type="button"
              disabled={inactive}
              onClick={handleRemove}
              className="block text-xs text-rose-300/80 hover:text-rose-200 disabled:opacity-50"
            >
              {status === "removing" ? "Removing…" : "Remove photo"}
            </button>
          )}
          <p className="text-[10px] text-sd-muted/70">
            PNG, JPG, or WebP · max 2 MB · paste anywhere on this form with
            Ctrl+V / ⌘V
            {isDraft ? " · saved when you create the employee" : ""}
          </p>
        </div>
      </div>

      {showStatus && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            status === "error"
              ? "border-rose-400/35 bg-rose-500/10 text-rose-100"
              : status === "success"
                ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                : "border-cyan-400/35 bg-cyan-500/10 text-cyan-100"
          }`}
        >
          {(status === "reading" ||
            status === "uploading" ||
            status === "removing") && (
            <span
              className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
