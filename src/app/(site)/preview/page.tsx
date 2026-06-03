import Link from "next/link";
import { PreviewBanner } from "@/components/PreviewBanner";
import { PhaseNav } from "@/components/PhaseNav";
import { REGION_LABELS } from "@/lib/scoring-config";

export default function PreviewHomePage() {
  return (
    <div className="space-y-8">
      <PreviewBanner />

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Preview leaderboards</h2>
        <p className="max-w-2xl text-slate-400">
          Sample standings with per-round regional elimination. Eliminated branches
          show — for rounds they did not play.
        </p>
      </section>

      <PhaseNav active="june" basePath="/preview" />

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold text-amber-300">June (by region)</h3>
          <div className="flex flex-wrap gap-2">
            {(["luzon", "ncr", "vismin"] as const).map((r) => (
              <Link
                key={r}
                href={`/preview/june/${r}`}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
              >
                {REGION_LABELS[r]}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/preview/july"
            className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-amber-500/50"
          >
            <h3 className="font-semibold text-amber-300">July preview</h3>
            <p className="mt-1 text-sm text-slate-400">
              8→4→2→1 per region · pick a region on the page
            </p>
          </Link>
          <Link
            href="/preview/august"
            className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-amber-500/50"
          >
            <h3 className="font-semibold text-amber-300">August preview</h3>
            <p className="mt-1 text-sm text-slate-400">
              Finals · 3 regional champions
            </p>
          </Link>
        </div>
      </div>

      <Link
        href="/preview/tv?phase=june&region=luzon"
        className="inline-block text-sm text-slate-400 hover:text-white"
      >
        Open TV preview mode →
      </Link>
    </div>
  );
}
