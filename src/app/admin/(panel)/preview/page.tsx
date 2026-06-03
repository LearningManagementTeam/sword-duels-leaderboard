import Link from "next/link";

const previewLinks = [
  {
    href: "/preview",
    label: "Preview hub",
    description: "Overview of all sample leaderboards",
  },
  {
    href: "/preview/june",
    label: "June preview",
    description: "142 branches · area-wide · top 24 cut line",
  },
  {
    href: "/preview/july/luzon",
    label: "July — Luzon",
    description: "Regional sample board",
  },
  {
    href: "/preview/july/ncr",
    label: "July — NCR",
    description: "Regional sample board",
  },
  {
    href: "/preview/july/vismin",
    label: "July — VisMin",
    description: "Regional sample board",
  },
  {
    href: "/preview/august",
    label: "August preview",
    description: "Finals · 3 regional champions",
  },
  {
    href: "/preview/tv?phase=june",
    label: "TV preview",
    description: "Fullscreen mode for events (sample data)",
  },
];

export default function AdminPreviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Preview leaderboards</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Open these links to show sample standings with branch and representative
          names. Preview data never touches the live database.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {previewLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-slate-700 bg-slate-900/50 p-4 hover:border-amber-500/50"
            >
              <span className="font-medium text-amber-300">{link.label}</span>
              <span className="mt-1 block text-xs text-slate-500">
                {link.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">
        Official public boards:{" "}
        <Link href="/june" className="text-slate-400 underline hover:text-white">
          /june
        </Link>
        ,{" "}
        <Link href="/july" className="text-slate-400 underline hover:text-white">
          /july
        </Link>
        ,{" "}
        <Link
          href="/august"
          className="text-slate-400 underline hover:text-white"
        >
          /august
        </Link>
      </p>
    </div>
  );
}
