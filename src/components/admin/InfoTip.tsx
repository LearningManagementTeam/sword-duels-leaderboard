"use client";

import { useId, useState } from "react";

interface Props {
  label?: string;
  children: React.ReactNode;
  /** Tooltip placement — use `below` in tight horizontal nav. */
  placement?: "right" | "below";
}

export function InfoTip({
  label = "Help",
  children,
  placement = "right",
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  const panelClass =
    placement === "below"
      ? "absolute left-0 top-full z-50 mt-1.5 w-72 max-w-[min(18rem,calc(100vw-2rem))]"
      : "absolute left-6 top-0 z-50 w-64 max-w-[min(16rem,calc(100vw-2rem))]";

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full sd-glass text-xs text-sd-muted ring-1 ring-fuchsia-400/30 hover:text-sd-glow"
        title={label}
        aria-label={label}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`sd-neon-panel px-3 py-2 text-left text-xs font-normal leading-relaxed text-sd-muted shadow-xl ${panelClass}`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
