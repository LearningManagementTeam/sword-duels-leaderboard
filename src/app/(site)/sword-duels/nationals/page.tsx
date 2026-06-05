import Link from "next/link";
import { SetupBanner } from "@/components/SetupBanner";
import { NationalsKnockoutSection } from "@/components/sword-duels/NationalsKnockoutSection";
import { NationalsWildcardMap } from "@/components/sword-duels/NationalsWildcardMap";
import { SwordDuelsPublicFooter } from "@/components/sword-duels/SwordDuelsPublicFooter";
import { loadNationalsPublicView } from "@/lib/products/sword-duels/load-nationals-public-view";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sword Duels Nationals",
};

export default async function SwordDuelsNationalsPage() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return (
      <div className="space-y-6">
        <SetupBanner />
      </div>
    );
  }

  const event = await getSdEvent();
  if (!event) {
    return (
      <p className="text-sd-muted">Sword Duels event not configured.</p>
    );
  }

  let view: Awaited<ReturnType<typeof loadNationalsPublicView>> | null = null;
  try {
    view = await loadNationalsPublicView(event.id);
  } catch {
    return (
      <div className="space-y-4">
        <p className="text-sd-muted">
          Nationals tables are not ready. Run migration{" "}
          <code className="text-xs">019_sd_nationals_wildcard.sql</code> and{" "}
          <code className="text-xs">020_sd_nationals_knockout.sql</code> (or{" "}
          <code className="text-xs">016_sword_duels_repair.sql</code>) in
          Supabase, then refresh.
        </p>
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← Back to Sword Duels
        </Link>
      </div>
    );
  }

  const { model } = view;
  const knockoutSubtitle = view.knockoutIsLive
    ? "Live results — winners advance as the committee publishes each match."
    : model.allFieldLocked
      ? "Field locked — knockout pairings shown; results appear when matches are published."
      : "Placeholder pairings until all area reps and the wild card are locked.";

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link text-sm">
          ← All areas
        </Link>
        <h1>Sword Duels Nationals</h1>
        <p className="mt-1 text-sm text-sd-muted">
          Wild card slot 16, then area vs area knockout to one national champion.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link
            href={`${SWORD_DUELS_PUBLIC}/tv?mode=nationals&view=wildcard&rotate=60`}
            className="sd-link"
          >
            Nationals TV view →
          </Link>
          <Link
            href={`${SWORD_DUELS_PUBLIC}/tv?mode=event&rotate=90`}
            className="sd-link"
          >
            Full event TV rotate →
          </Link>
          <Link href={`${SWORD_DUELS_PUBLIC}/mechanics`} className="sd-link">
            How it works →
          </Link>
        </p>
      </div>

      <NationalsWildcardMap
        model={view.model}
        scores={view.wildcardScores}
        confirmedWildcardId={view.confirmedWildcardId}
        publicView
      />

      <NationalsKnockoutSection
        model={view.knockoutModel}
        preview={view.knockoutIsPreview}
        defaultOpen={model.allFieldLocked || view.knockoutIsLive}
        subtitle={knockoutSubtitle}
        previewLink={
          view.knockoutIsPreview && !model.allFieldLocked ? (
            <Link
              href="/preview/sword-duels/nationals/knockout"
              className="sd-link text-sm"
            >
              Full placeholder preview →
            </Link>
          ) : undefined
        }
      />

      <SwordDuelsPublicFooter
        sharePath={`${SWORD_DUELS_PUBLIC}/nationals`}
        shareTitle="Share Sword Duels Nationals"
      />
    </div>
  );
}
