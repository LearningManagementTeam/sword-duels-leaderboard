import type { Metadata } from "next";
import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { SdFullJourneyTest } from "@/components/sword-duels/SdFullJourneyTest";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { loadFullJourneyView } from "@/lib/products/sword-duels/load-full-journey-view";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Full journey test — Sword Duels",
  robots: { index: false, follow: false },
};

export default async function SwordDuelsFullJourneyTestPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <SetupBanner />
      </div>
    );
  }

  const view = await loadFullJourneyView().catch(() => null);

  if (!view || view.areas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="sd-page-header">
          <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
            ← Sword Duels
          </Link>
          <h1>Full journey test</h1>
          <p className="text-sd-muted">
            Brackets are not ready yet — sync branches and area groups in admin
            first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-2 pb-16">
      <header className="sd-page-header">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← Sword Duels
        </Link>
        <h1>Full tournament journey</h1>
        <p>
          Every phase on one page — group battles, area selections,{" "}
          {view.isV2 ? "regionals" : "wild card"}, and national finals.
        </p>
      </header>

      <SdFullJourneyTest view={view} />
    </div>
  );
}
