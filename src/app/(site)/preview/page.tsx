import Link from "next/link";
import { PreviewBanner } from "@/components/PreviewBanner";
import { PhaseNav } from "@/components/PhaseNav";
import { REGION_LABELS } from "@/lib/scoring-config";

export default function PreviewHomePage() {
  return (
    <div className="space-y-8">
      <PreviewBanner />

      <section className="sd-page-header space-y-3">
        <h2 className="text-2xl font-bold text-white">Preview leaderboards</h2>
        <p className="max-w-2xl text-sd-muted">
          Sample standings with per-round regional elimination. Eliminated branches
          show — for rounds they did not play.
        </p>
      </section>

      <PhaseNav active="june" basePath="/preview" />

      <div className="space-y-6">
        <div className="sd-neon-panel p-5">
          <h3 className="mb-2 font-semibold text-sd-glow">June (by region)</h3>
          <div className="flex flex-wrap gap-2">
            {(["luzon", "ncr", "vismin"] as const).map((r) => (
              <Link
                key={r}
                href={`/preview/june/${r}`}
                className="sd-glass rounded-lg px-4 py-2 text-sm text-sd-muted hover:text-sd-glow"
              >
                {REGION_LABELS[r]}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/preview/july/luzon" className="sd-neon-panel block p-5 transition hover:shadow-lg hover:shadow-emerald-500/10">
            <h3 className="font-semibold text-sd-glow">July preview</h3>
            <p className="mt-1 text-sm text-sd-muted">
              8→4→2→1 per region · Luzon, NCR, or VisMin
            </p>
          </Link>
          <Link href="/preview/august" className="sd-neon-panel block p-5 transition hover:shadow-lg hover:shadow-fuchsia-500/10">
            <h3 className="font-semibold text-sd-glow">The Nationals preview</h3>
            <p className="mt-1 text-sm text-sd-muted">
              One-day event · 3 rounds · 3 regional champions
            </p>
          </Link>
          <Link href="/preview/sword-duels/nationals/knockout" className="sd-neon-panel block p-5 transition hover:shadow-lg hover:shadow-fuchsia-500/10 sm:col-span-2">
            <h3 className="font-semibold text-fuchsia-300">Nationals knockout preview</h3>
            <p className="mt-1 text-sm text-sd-muted">
              Area 1 vs 2, 3 vs 4 … 15 vs Wild card · full bracket placeholders
            </p>
          </Link>
        </div>
      </div>

      <Link href="/preview/tv?phase=june&region=luzon" className="sd-link text-sm">
        Open TV preview mode →
      </Link>
    </div>
  );
}
