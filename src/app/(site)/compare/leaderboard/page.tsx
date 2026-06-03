import Link from "next/link";
import { CompareLayoutBanner } from "@/components/leaderboard/CompareLayoutBanner";

const OPTIONS = [
  {
    href: "/compare/leaderboard/three-columns",
    title: "Three columns (A)",
    blurb:
      "Luzon, NCR, and VisMin side-by-side on desktop — great for event screens and regional rivalry.",
    best: "Desktop & wide screens",
  },
  {
    href: "/compare/leaderboard/stacked",
    title: "Stacked regions (B1)",
    blurb:
      "One card, three regions in a scroll — easy on mobile, one-handed browsing.",
    best: "Mobile-first",
  },
  {
    href: "/compare/leaderboard/unified",
    title: "Unified table (B2)",
    blurb:
      "All branches in one searchable table with a Region column — power-user mode.",
    best: "Search & filter fans",
  },
] as const;

export default function CompareLeaderboardPickerPage() {
  return (
    <div className="space-y-6">
      <CompareLayoutBanner layoutName="Choose a layout" layoutSlug="picker" />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
          Layout lab
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Pick your full leaderboard view
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-sd-muted">
          Open each option on your phone and desktop. Each preview uses sample
          June standings (45 branches per region, after Round 3) so you can see
          podiums, cut lines, and search in action. Tell us which feels best —
          we&apos;ll make that the permanent full leaderboard page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="sd-neon-panel block space-y-2 p-5 transition hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <h2 className="font-semibold text-sd-glow">{opt.title}</h2>
            <p className="text-sm text-sd-muted">{opt.blurb}</p>
            <p className="text-xs text-sd-muted/70">Best for: {opt.best}</p>
            <span className="inline-block pt-2 text-sm font-medium text-emerald-200">
              Preview this layout →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
