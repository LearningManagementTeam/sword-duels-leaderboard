import Link from "next/link";
import { swordDuelsPath } from "@/lib/admin-routes";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";

interface Props {
  prevArea: string | null;
  nextArea: string | null;
  index: number;
  total: number;
}

function NavLink({
  href,
  label,
  direction,
}: {
  href: string;
  label: string;
  direction: "prev" | "next";
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-w-[7rem] items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-sd-deep/40 px-3 py-2 text-sm font-medium text-white transition hover:border-emerald-400/40 hover:bg-emerald-500/10 sm:min-w-[9rem]"
    >
      {direction === "prev" ? (
        <>
          <span aria-hidden>←</span>
          <span className="truncate">{label}</span>
        </>
      ) : (
        <>
          <span className="truncate">{label}</span>
          <span aria-hidden>→</span>
        </>
      )}
    </Link>
  );
}

function NavPlaceholder({ direction }: { direction: "prev" | "next" }) {
  return (
    <span
      aria-hidden
      className="inline-flex min-w-[7rem] items-center justify-center rounded-lg border border-emerald-500/10 bg-sd-deep/20 px-3 py-2 text-sm text-sd-muted/40 sm:min-w-[9rem]"
    >
      {direction === "prev" ? "← Previous" : "Next →"}
    </span>
  );
}

export function AreaAdminPager({ prevArea, nextArea, index, total }: Props) {
  if (total <= 1) return null;

  return (
    <nav
      aria-label="Area navigation"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-500/15 bg-sd-deep/30 px-4 py-3"
    >
      {prevArea ? (
        <NavLink
          href={swordDuelsPath("areas", areaSlug(prevArea))}
          label={prevArea}
          direction="prev"
        />
      ) : (
        <NavPlaceholder direction="prev" />
      )}

      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/90">
          Area {index + 1} of {total}
        </p>
        <Link
          href={swordDuelsPath("areas")}
          className="mt-0.5 inline-block text-xs text-sd-muted transition hover:text-emerald-200"
        >
          All areas
        </Link>
      </div>

      {nextArea ? (
        <NavLink
          href={swordDuelsPath("areas", areaSlug(nextArea))}
          label={nextArea}
          direction="next"
        />
      ) : (
        <NavPlaceholder direction="next" />
      )}
    </nav>
  );
}
