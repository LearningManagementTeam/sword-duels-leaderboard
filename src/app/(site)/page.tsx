import Link from "next/link";
import { HeroLogo } from "@/components/branding/HeroLogo";
import {
  HomeRegionCarousel,
  HomeSeasonCarousel,
} from "@/components/home/HomeCarousels";
import { PhaseNav } from "@/components/PhaseNav";
import { SetupBanner } from "@/components/SetupBanner";
import { ShareCard } from "@/components/ShareCard";
import { getBranding } from "@/lib/data/content-queries";
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

export default async function HomePage() {
  const configured = isSupabaseConfigured();
  const branding = await getBranding();

  return (
    <div className="space-y-8">
      <HeroLogo branding={branding} priority />

      <HomeSeasonCarousel />
      <HomeRegionCarousel />

      <section className="sd-neon-panel relative overflow-hidden p-6 sm:p-8">
        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Live standings
          </h2>
          <p className="max-w-2xl text-sd-muted">
            Track standings across three phases: June area-wide (130+ branches →
            top 24), July regional, and August finals.
          </p>
        </div>
      </section>

      {!configured && <SetupBanner />}

      <PhaseNav active="june" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/june"
          className="sd-glass rounded-xl p-5 transition hover:border-sd-glow/40 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <h3 className="font-semibold text-sd-glow">June</h3>
          <p className="mt-1 text-sm text-sd-muted">
            Area-wide · 3 rounds · Top 24 advance
          </p>
        </Link>
        <Link
          href="/july"
          className="sd-glass rounded-xl p-5 transition hover:border-sd-glow/40"
        >
          <h3 className="font-semibold text-sd-glow">July</h3>
          <p className="mt-1 text-sm text-sd-muted">
            Regional · 24 survivors · 3 finalists
          </p>
        </Link>
        <Link
          href="/august"
          className="sd-glass rounded-xl p-5 transition hover:border-sd-glow/40"
        >
          <h3 className="font-semibold text-sd-glow">August</h3>
          <p className="mt-1 text-sm text-sd-muted">
            Finals · Regional champions
          </p>
        </Link>
      </div>

      <section className="sd-glass rounded-xl p-5">
        <h3 className="font-semibold text-white">Find standings</h3>
        <p className="mt-1 text-sm text-sd-muted">
          Pick a region to open the live board. Tip: add{" "}
          <code className="text-sd-glow">?highlight=BRANCH_CODE</code> to
          highlight your branch.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regions.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="sd-btn-primary rounded-lg px-4 py-2 text-sm"
            >
              June · {r.label}
            </Link>
          ))}
        </div>
      </section>

      <Link
        href="/mechanics"
        className="block sd-glass rounded-xl p-4 text-sm text-sd-muted hover:border-sd-glow/30"
      >
        <span className="font-medium text-sd-glow">How it works</span>
        <span className="text-sd-muted/70"> — phases, cuts, tie-breakers</span>
      </Link>

      <ShareCard url={SITE_URL} />

      <p className="text-sm text-sd-muted/70">
        Want to see sample data first?{" "}
        <Link
          href="/preview"
          className="text-sd-glow underline hover:text-emerald-200"
        >
          Open preview leaderboards
        </Link>
      </p>
    </div>
  );
}
