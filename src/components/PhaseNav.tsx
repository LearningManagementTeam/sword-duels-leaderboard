import Link from "next/link";

const phases = [
  { href: "/june", label: "June", sub: "Area-wide" },
  { href: "/july", label: "July", sub: "Regional" },
  { href: "/august", label: "August", sub: "Finals" },
];

export function PhaseNav({ active }: { active: "june" | "july" | "august" }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {phases.map((p) => {
        const key = p.href.slice(1) as typeof active;
        const isActive = key === active;
        return (
          <Link
            key={p.href}
            href={p.href}
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
