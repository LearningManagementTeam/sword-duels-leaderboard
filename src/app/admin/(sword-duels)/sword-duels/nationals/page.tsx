import Link from "next/link";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { KnockoutAdminForm } from "@/components/sword-duels/KnockoutAdminForm";
import { WildcardAdminForm } from "@/components/sword-duels/WildcardAdminForm";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import {
  SWORD_DUELS_ADMIN,
  SWORD_DUELS_PUBLIC,
  swordDuelsPath,
} from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Sword Duels Nationals",
};

export default async function AdminSwordDuelsNationalsPage() {
  const event = await getSdEvent();
  if (!event) {
    return (
      <p className="text-sd-muted">Sword Duels event not configured.</p>
    );
  }

  let context: Awaited<ReturnType<typeof getSdNationalsContext>> | null = null;
  let loadError: string | null = null;

  try {
    context = await getSdNationalsContext(event.id);
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load nationals data";
  }

  const scoresByMatchId: Record<
    string,
    { branch_id: string; points: number }[]
  > = {};

  if (context?.knockoutMatches.length) {
    try {
      const { loadKnockoutMatchScores } = await import(
        "@/lib/products/sword-duels/knockout-sync"
      );
      const map = await loadKnockoutMatchScores(
        context.knockoutMatches.map((m) => m.id)
      );
      for (const [matchId, rows] of map.entries()) {
        scoresByMatchId[matchId] = rows;
      }
    } catch {
      /* migration 020 not applied */
    }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
          { label: "Nationals" },
        ]}
      />
      <div className="sd-page-header">
        <h1>Sword Duels Nationals</h1>
        <p>
          Wildcard slot opens after every area final is published. When the full
          field is locked, score and publish knockout matches round by round.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link
            href={`${SWORD_DUELS_PUBLIC}/nationals`}
            className="sd-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open public map →
          </Link>
          <Link href={swordDuelsPath("areas")} className="sd-link">
            Area scoring
          </Link>
        </p>
      </div>

      {loadError ? (
        <div className="sd-neon-panel space-y-2 p-4 text-sm text-amber-100">
          <p>{loadError}</p>
          <p>
            Run{" "}
            <code className="text-xs">019_sd_nationals_wildcard.sql</code>,{" "}
            <code className="text-xs">020_sd_nationals_knockout.sql</code>, or{" "}
            <code className="text-xs">016_sword_duels_repair.sql</code> in
            Supabase SQL Editor, then refresh.
          </p>
        </div>
      ) : context ? (
        <>
          <WildcardAdminForm model={context.model} />
          <KnockoutAdminForm
            wildcardModel={context.model}
            knockoutModel={context.knockoutModel}
            dbMatches={context.knockoutMatches}
            scoresByMatchId={scoresByMatchId}
          />
        </>
      ) : null}
    </div>
  );
}
