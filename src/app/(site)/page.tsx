import Link from "next/link";
import { PhaseNav } from "@/components/PhaseNav";
import { SetupBanner } from "@/components/SetupBanner";
import { ShareCard } from "@/components/ShareCard";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://sword-duels-leaderboard.vercel.app");

const regions = [
  { href: "/june/luzon", label: "Luzon" },
  { href: "/june/ncr", label: "NCR" },
  { href: "/june/vismin", label: "VisMin" },
];

export default function HomePage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8">
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold text-white">
            Sword Duels Leaderboard
          </h2>
          <p className="max-w-2xl text-slate-400">
            Track standings across three phases: June area-wide (130+ branches →
            top 24), July regional, and August finals.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Season path
            </span>
            <div className="flex flex-wrap items-center gap-1 text-sm">
              {["June", "July", "August"].map((label, i) => (
                <span key={label} className="flex items-center gap-1">
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-amber-200">
                    {label}
                  </span>
                  {i < 2 && (
                    <span className="text-slate-600" aria-hidden>
                      →
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
          aria-hidden
        />
      </section>

      {!configured && <SetupBanner />}

      <PhaseNav active="june" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/june"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 transition hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5"
        >
          <h3 className="font-semibold text-amber-300">June</h3>
          <p className="mt-1 text-sm text-slate-400">
            Area-wide · 3 rounds · Top 24 advance
          </p>
          <p className="mt-2 text-xs text-amber-400/80">View mechanics →</p>
        </Link>
        <Link
          href="/july"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 transition hover:border-amber-500/50"
        >
          <h3 className="font-semibold text-amber-300">July</h3>
          <p className="mt-1 text-sm text-slate-400">
            Regional · 24 survivors · 3 finalists
          </p>
        </Link>
        <Link
          href="/august"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 transition hover:border-amber-500/50"
        >
          <h3 className="font-semibold text-amber-300">August</h3>
          <p className="mt-1 text-sm text-slate-400">
            Finals · Regional champions
          </p>
        </Link>
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
        <h3 className="font-semibold text-white">Find standings</h3>
        <p className="mt-1 text-sm text-slate-400">
          Pick a region to open the live board. Tip: add{" "}
          <code className="text-amber-200/90">?highlight=BRANCH_CODE</code> to
          highlight your branch.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regions.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400"
            >
              June · {r.label}
            </Link>
          ))}
        </div>
      </section>

      <Link
        href="/mechanics"
        className="block rounded-xl border border-slate-700 bg-slate-900/30 p-4 text-sm text-slate-300 hover:border-amber-500/40"
      >
        <span className="font-medium text-amber-300">How it works</span>
        <span className="text-slate-500"> — phases, cuts, tie-breakers</span>
      </Link>

      <ShareCard url={SITE_URL} />

      <p className="text-sm text-slate-500">
        Want to see sample data first?{" "}
        <Link
          href="/preview"
          className="text-amber-300/80 underline hover:text-amber-200"
        >
          Open preview leaderboards
        </Link>
      </p>
    </div>
  );
}
