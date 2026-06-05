import Link from "next/link";
import { seasonPhaseLabel } from "@/lib/season-labels";
import { REGION_LABELS } from "@/lib/scoring-config";

const previewLinks = [
  {
    href: "/admin/national-competitions/preview/capacity",
    label: "Full roster capacity (compiled)",
    description:
      "All regional slots in one page — real branches plus placeholders for empty seats",
  },
  {
    href: "/preview/capacity",
    label: "Public capacity preview",
    description: "Same compiled layout at /preview/capacity (share with stakeholders)",
  },
  {
    href: "/preview",
    label: "Preview hub",
    description: "Overview of all sample leaderboards (demo data only)",
  },
  {
    href: "/preview/june/luzon",
    label: `${seasonPhaseLabel("june_area")} — ${REGION_LABELS.luzon}`,
    description: "Area-wide · 32→16→8 survivors per round",
  },
  {
    href: "/preview/june/ncr",
    label: `${seasonPhaseLabel("june_area")} — ${REGION_LABELS.ncr}`,
    description: "Area-wide elimination sample",
  },
  {
    href: "/preview/june/vismin",
    label: `${seasonPhaseLabel("june_area")} — ${REGION_LABELS.vismin}`,
    description: "Area-wide elimination sample",
  },
  {
    href: "/preview/july/luzon",
    label: `${seasonPhaseLabel("july_region")} — ${REGION_LABELS.luzon}`,
    description: "Regional playoff · 8→4→2→1 funnel",
  },
  {
    href: "/preview/july/ncr",
    label: `${seasonPhaseLabel("july_region")} — ${REGION_LABELS.ncr}`,
    description: "Regional playoff sample",
  },
  {
    href: "/preview/july/vismin",
    label: `${seasonPhaseLabel("july_region")} — ${REGION_LABELS.vismin}`,
    description: "Regional playoff sample",
  },
  {
    href: "/preview/august",
    label: `${seasonPhaseLabel("august_finals")} preview`,
    description: "One-day championship · 3 rounds · 3 regional champions",
  },
  {
    href: "/preview/tv?phase=june",
    label: "TV / venue preview",
    description: "Fullscreen board for events (sample data)",
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
          The Nationals (/august)
        </Link>
      </p>
    </div>
  );
}
