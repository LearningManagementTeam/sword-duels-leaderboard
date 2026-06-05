"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SdCollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: Props) {
  return (
    <details
      className="group sd-neon-panel overflow-hidden"
      open={defaultOpen || undefined}
    >
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-sd-muted/80">{subtitle}</p>
            )}
          </div>
          <span
            className="mt-1 shrink-0 text-xs font-semibold uppercase tracking-wider text-sd-glow transition group-open:rotate-180"
            aria-hidden
          >
            ▼
          </span>
        </div>
      </summary>
      <div className="border-t border-emerald-500/10 px-5 pb-5 pt-4">
        {children}
      </div>
    </details>
  );
}
