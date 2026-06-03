import Link from "next/link";
import { PreviewBanner } from "@/components/PreviewBanner";
import { PhaseNav } from "@/components/PhaseNav";

export default function PreviewHomePage() {
  return (
    <div className="space-y-8">
      <PreviewBanner />

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Preview leaderboards</h2>
        <p className="max-w-2xl text-slate-400">
          Sample standings with 142 branches and representative names. Use these
          pages to show stakeholders what the site will look like before real
          scores are published.
        </p>
      </section>

      <PhaseNav active="june" basePath="/preview" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/preview/june"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-amber-500/50"
        >
          <h3 className="font-semibold text-amber-300">June preview</h3>
          <p className="mt-1 text-sm text-slate-400">
            Full area-wide board · 142 branches · Top 24 cut line
          </p>
        </Link>
        <Link
          href="/preview/july"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-amber-500/50"
        >
          <h3 className="font-semibold text-amber-300">July preview</h3>
          <p className="mt-1 text-sm text-slate-400">
            Regional boards · Luzon, NCR, VisMin
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

      <Link
        href="/preview/tv?phase=june"
        className="inline-block text-sm text-slate-400 hover:text-white"
      >
        Open TV preview mode →
      </Link>
    </div>
  );
}
