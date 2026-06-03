import Link from "next/link";

const phases = [
  { slug: "june", label: "June", sub: "Area-wide" },
  { slug: "july", label: "July", sub: "Regional" },
  { slug: "august", label: "August", sub: "Finals" },
] as const;

export function PhaseNav({
  active,
  basePath = "",
}: {
  active: "june" | "july" | "august";
  basePath?: string;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {phases.map((p) => {
        const isActive = p.slug === active;
        return (
          <Link
            key={p.slug}
            href={`${basePath}/${p.slug}`}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              isActive
                ? "bg-amber-500 text-slate-900 font-semibold"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
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
