import Link from "next/link";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

export function HomeProgramsStrip() {
  return (
    <section className="sd-neon-panel mx-auto max-w-3xl p-5">
      <h2 className="text-base font-semibold text-white">Programs</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Link
          href="/june"
          className="sd-inset block rounded-lg p-4 transition hover:ring-1 hover:ring-emerald-400/25"
        >
          <p className="font-medium text-white">National Competitions</p>
          <p className="mt-1 text-xs text-sd-muted">
            June area-wide → July regional → The Nationals
          </p>
        </Link>
        <Link
          href={SWORD_DUELS_PUBLIC}
          className="sd-inset block rounded-lg p-4 transition hover:ring-1 hover:ring-cyan-400/25"
        >
          <p className="font-medium text-white">Sword Duels</p>
          <p className="mt-1 text-xs text-sd-muted">
            Area group battles — 2 spots fight for 1 area representative
          </p>
        </Link>
      </div>
    </section>
  );
}
