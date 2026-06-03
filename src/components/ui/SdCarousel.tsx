"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Animation duration e.g. "35s" */
  duration?: string;
  className?: string;
  label?: string;
}

export function SdCarousel({
  children,
  duration = "40s",
  className = "",
  label,
}: Props) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className={`sd-neon-panel overflow-hidden p-3 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-label={label}
      aria-live="off"
    >
      <div className="sd-inset overflow-hidden rounded-xl py-2">
        <div
          className={paused ? "sd-carousel-paused" : ""}
          style={{ "--sd-carousel-duration": duration } as CSSProperties}
        >
          <div className="sd-carousel-track px-2">
            {children}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SdCarouselItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 rounded-full border border-emerald-400/30 bg-gradient-to-r from-emerald-950/80 to-fuchsia-950/40 px-4 py-2 text-sm font-medium text-sd-muted shadow-[0_0_12px_rgb(74_222_128/0.15)] transition hover:border-fuchsia-400/50 hover:text-white ${className}`}
    >
      {children}
    </div>
  );
}
