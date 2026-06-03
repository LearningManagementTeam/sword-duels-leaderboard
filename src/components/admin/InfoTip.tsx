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
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-300 hover:bg-slate-600 hover:text-white"
        title={label}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-6 top-0 z-50 w-64 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-left text-xs font-normal text-slate-200 shadow-xl"
        >
          {children}
        </span>
      )}
    </span>
  );
}
