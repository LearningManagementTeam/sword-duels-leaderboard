import Link from "next/link";
import { PHASE_DISPLAY, type PhaseSlug } from "@/lib/season-labels";
import type { Region } from "@/lib/scoring-config";

const phases = (["june", "july", "august"] as const).map((slug) => ({
  slug,
  label: PHASE_DISPLAY[slug].label,
  sub: PHASE_DISPLAY[slug].subtitle,
}));

export function PhaseNav({
  active,
  basePath = "",
  defaultRegion = "luzon",
  compact = false,
}: {
  active: PhaseSlug;
  basePath?: string;
  defaultRegion?: Region;
  compact?: boolean;
}) {
  return (
    <nav
      className={`flex flex-wrap gap-1.5 ${compact ? "justify-center sm:justify-start" : "gap-2"}`}
      aria-label="Competition phase"
    >
      {phases.map((p) => {
        const isActive = p.slug === active;
        const href =
          p.slug === "august"
            ? `${basePath}/august`
            : `${basePath}/${p.slug}/${defaultRegion}`;
        return (
          <Link
            key={p.slug}
            href={href}
            className={`rounded-xl transition ${
              compact ? "px-3 py-1.5" : "px-4 py-2"
            } text-sm ${
              isActive
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep shadow-[0_0_16px_rgb(163_230_53/0.3)] ring-1 ring-fuchsia-400/30"
                : "sd-glass text-sd-muted hover:border-fuchsia-400/30 hover:text-white"
            }`}
          >
            <span className={`block font-medium ${compact ? "text-xs sm:text-sm" : ""}`}>
              {p.label}
            </span>
            <span
              className={`block text-xs opacity-80 ${
                compact ? "hidden sm:block" : ""
              }`}
            >
              {p.sub}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
