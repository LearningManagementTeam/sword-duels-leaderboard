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

export default function HomePage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">
          Competition leaderboard
        </h2>
        <p className="max-w-2xl text-slate-400">
          Track standings across three phases: June area-wide (130+ branches → top
          24), July regional (Luzon, NCR, VisMin), and August finals.
        </p>
      </section>

      {!configured && <SetupBanner />}

      <PhaseNav active="june" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/june"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-amber-500/50"
        >
          <h3 className="font-semibold text-amber-300">June</h3>
          <p className="mt-1 text-sm text-slate-400">
            Area-wide · 3 rounds · Top 24 advance
          </p>
        </Link>
        <Link
          href="/july"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-amber-500/50"
        >
          <h3 className="font-semibold text-amber-300">July</h3>
          <p className="mt-1 text-sm text-slate-400">
            Regional · 24 survivors · 3 finalists
          </p>
        </Link>
        <Link
          href="/august"
          className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-amber-500/50"
        >
          <h3 className="font-semibold text-amber-300">August</h3>
          <p className="mt-1 text-sm text-slate-400">
            Finals · Regional champions
          </p>
        </Link>
      </div>

      <ShareCard url={SITE_URL} />

      <p className="text-sm text-slate-500">
        Want to see sample data first?{" "}
        <Link href="/preview" className="text-amber-300/80 underline hover:text-amber-200">
          Open preview leaderboards
        </Link>
      </p>
    </div>
  );
}
