import Link from "next/link";
import type { Region } from "@/lib/scoring-config";

const phases = [
  { slug: "june", label: "June", sub: "Area-wide" },
  { slug: "july", label: "July", sub: "Regional" },
  { slug: "august", label: "August", sub: "Finals" },
] as const;

export function PhaseNav({
  active,
  basePath = "",
  defaultRegion = "luzon",
}: {
  active: "june" | "july" | "august";
  basePath?: string;
  defaultRegion?: Region;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Competition phase">
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
            className={`rounded-xl px-4 py-2 text-sm transition ${
              isActive
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep shadow-[0_0_20px_rgb(163_230_53/0.35)] ring-1 ring-fuchsia-400/30"
                : "sd-glass text-sd-muted hover:border-fuchsia-400/30 hover:text-white"
            }`}
          >
            <span className="block font-medium">{p.label}</span>
            <span className="block text-xs opacity-80">{p.sub}</span>
          </Link>
        );
      })}
    </nav>
  );
}
