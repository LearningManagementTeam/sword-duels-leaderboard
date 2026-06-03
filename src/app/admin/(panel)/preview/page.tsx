import Link from "next/link";

const previewLinks = [
  {
    href: "/preview",
    label: "Preview hub",
    description: "Overview of all sample leaderboards",
  },
  {
    href: "/preview/june/luzon",
    label: "June — Luzon",
    description: "Per-round elimination · 32→16→8 survivors",
  },
  {
    href: "/preview/june/ncr",
    label: "June — NCR",
    description: "Per-round elimination sample",
  },
  {
    href: "/preview/june/vismin",
    label: "June — VisMin",
    description: "Per-round elimination sample",
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
    label: "The Nationals preview",
    description: "One-day event · 3 rounds · 3 regional champions",
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
      <div className="sd-page-header">
        <h1>Preview leaderboards</h1>
        <p>
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
              className="sd-neon-panel block p-4 transition hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <span className="font-medium text-sd-glow">{link.label}</span>
              <span className="mt-1 block text-xs text-sd-muted/70">
                {link.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-xs text-sd-muted/60">
        Official public boards:{" "}
        <Link href="/june/luzon" className="sd-link">
          /june/luzon
        </Link>
        ,{" "}
        <Link href="/july/luzon" className="sd-link">
          /july/luzon
        </Link>
        ,{" "}
        <Link href="/august" className="sd-link">
          /august
        </Link>
      </p>
    </div>
  );
}
