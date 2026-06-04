"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  tone?: "warning" | "danger";
}

export function AdminConfirmPanel({
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
  tone = "warning",
}: Props) {
  const panelClass =
    tone === "danger"
      ? "border-fuchsia-400/35 bg-fuchsia-950/20"
      : "sd-alert-warning";

  const confirmClass =
    tone === "danger" ? "sd-btn-secondary" : "sd-btn-primary";

  return (
    <div
      role="dialog"
      aria-labelledby="admin-confirm-title"
      className={`rounded-xl px-4 py-4 ${panelClass}`}
    >
      <p id="admin-confirm-title" className="font-semibold text-white">
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed opacity-95">{children}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 text-sm disabled:opacity-50 ${confirmClass}`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
