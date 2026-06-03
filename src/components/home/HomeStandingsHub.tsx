import Link from "next/link";

const juneRegions = [
  { href: "/june/luzon", label: "Luzon" },
  { href: "/june/ncr", label: "NCR" },
  { href: "/june/vismin", label: "VisMin" },
] as const;

const julyRegions = [
  { href: "/july/luzon", label: "Luzon" },
  { href: "/july/ncr", label: "NCR" },
  { href: "/july/vismin", label: "VisMin" },
] as const;

const phases = [
  {
    href: "/june",
    title: "June",
    blurb: "Area-wide · 3 rounds · Top 24 advance",
  },
  {
    href: "/july",
    title: "July",
    blurb: "Regional · 24 survivors · 3 finalists",
  },
  {
    href: "/august",
    title: "August",
    blurb: "Finals · Regional champions",
  },
] as const;

export function HomeStandingsHub() {
  return (
    <section className="sd-neon-panel space-y-5 p-6 sm:p-8">
      <div>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Standings
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-sd-muted">
          Three phases: June area-wide (branches battle for top 24), July regional,
          and August finals. Pick a phase, then a region when applicable.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {phases.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="sd-glass rounded-xl p-5 transition hover:border-sd-glow/40 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <h3 className="font-semibold text-sd-glow">{p.title}</h3>
            <p className="mt-1 text-sm text-sd-muted">{p.blurb}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">June by region</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {juneRegions.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="sd-btn-primary rounded-lg px-4 py-2 text-sm"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">July by region</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {julyRegions.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="sd-btn-secondary rounded-lg px-4 py-2 text-sm"
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Link
        href="/mechanics"
        className="block sd-glass rounded-xl p-4 text-sm text-sd-muted hover:border-sd-glow/30"
      >
        <span className="font-medium text-sd-glow">How it works</span>
        <span className="text-sd-muted/70"> — phases, cuts, tie-breakers</span>
      </Link>
    </section>
  );
}
