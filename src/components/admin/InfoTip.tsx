"use client";

import { useId, useState } from "react";

interface Props {
  label?: string;
  children: React.ReactNode;
}

export function InfoTip({ label = "Help", children }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full sd-glass text-xs text-sd-muted ring-1 ring-fuchsia-400/30 hover:text-sd-glow"
        title={label}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="sd-neon-panel absolute left-6 top-0 z-50 w-64 px-3 py-2 text-left text-xs font-normal text-sd-muted shadow-xl"
        >
          {children}
        </span>
      )}
    </span>
  );
}
