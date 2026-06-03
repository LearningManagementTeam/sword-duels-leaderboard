import Link from "next/link";
import { CompareLayoutBanner } from "@/components/leaderboard/CompareLayoutBanner";
import { PREVIEW_ROUNDS } from "@/lib/compare-preview-constants";

export default function CompareLeaderboardPickerPage() {
  return (
    <div className="space-y-6">
      <CompareLayoutBanner layoutName="Layout lab" layoutSlug="picker" />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
          Round 3 — approved
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Three-column full board
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-sd-muted">
          <strong className="text-white">Clash of the Knowledge Swords</strong>{" "}
          uses the three-column layout (Luzon · NCR · VisMin side-by-side). Round
          1 and Round 2 use regional boards during live play — preview how they
          look in three columns below.
        </p>
        <Link
          href="/compare/leaderboard/three-columns?round=3"
          className="sd-btn-primary mt-4 inline-block rounded-xl px-5 py-2.5 text-sm"
        >
          Open approved Round 3 board →
        </Link>
        <p className="mt-2 text-xs text-sd-muted/70">
          Live board when Round 3 is published:{" "}
          <Link href="/june/leaderboard" className="sd-link">
            /june/leaderboard
          </Link>
        </p>
      </div>

      <div className="sd-glass-strong space-y-3 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white">
          Preview Round 1 & 2 in three columns
        </h2>
        <p className="text-sm text-sd-muted">
          Same layout shell, different round styling (quiz ladder vs survival
          roster).
        </p>
        <div className="flex flex-wrap gap-2">
          {PREVIEW_ROUNDS.map((r) => (
            <Link
              key={r.round}
              href={`/compare/leaderboard/three-columns?round=${r.slug}`}
              className={`rounded-lg px-4 py-2 text-sm ${
                r.approvedLayout
                  ? "bg-emerald-500/20 font-medium text-emerald-100 ring-1 ring-emerald-400/40"
                  : "sd-glass text-sd-muted hover:text-sd-glow"
              }`}
            >
              R{r.round}: {r.name}
              {r.approvedLayout ? " ✓" : ""}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-emerald-500/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/60">
          Other layouts (Round 3 sample only)
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Link
            href="/compare/leaderboard/stacked"
            className="sd-neon-panel block space-y-2 p-5 transition hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <h2 className="font-semibold text-sd-glow">Stacked regions</h2>
            <p className="text-sm text-sd-muted">
              One scrollable card — mobile-first alternative (not chosen for R3).
            </p>
          </Link>
          <Link
            href="/compare/leaderboard/unified"
            className="sd-neon-panel block space-y-2 p-5 transition hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <h2 className="font-semibold text-sd-glow">Unified table</h2>
            <p className="text-sm text-sd-muted">
              All branches, one table with Region column (not chosen for R3).
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
