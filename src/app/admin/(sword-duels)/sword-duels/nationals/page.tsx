import Link from "next/link";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { KnockoutAdminForm } from "@/components/sword-duels/KnockoutAdminForm";
import { WildcardAdminForm } from "@/components/sword-duels/WildcardAdminForm";
import { getSdNationalsContext } from "@/lib/products/sword-duels/nationals-queries";
import { getSdEvent } from "@/lib/products/sword-duels/queries";
import { isRegionalAverageFormat } from "@/lib/products/sword-duels/tournament-format";
import { loadV2NationalsPublicView } from "@/lib/products/sword-duels/load-v2-nationals-public-view";
import { loadKnockoutBracketState } from "@/lib/products/sword-duels/knockout-sync";
import type { NationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
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

  const isV2 = isRegionalAverageFormat(event.tournament_format);

  if (isV2) {
    let v2View: Awaited<ReturnType<typeof loadV2NationalsPublicView>> | null =
      null;
    try {
      v2View = await loadV2NationalsPublicView(event.id, { admin: true });
    } catch (e) {
      return (
        <p className="text-sd-muted">
          {e instanceof Error ? e.message : "Could not load V2 nationals."}
        </p>
      );
    }

    let ko: Awaited<ReturnType<typeof loadKnockoutBracketState>> = {
      bracket: null,
      matches: [],
      scoresByMatchId: new Map(),
    };
    try {
      ko = await loadKnockoutBracketState(event.id);
    } catch {
      /* migration 020 */
    }

    const scoresByMatchId: Record<
      string,
      { branch_id: string; points: number }[]
    > = {};
    for (const [matchId, rows] of ko.scoresByMatchId.entries()) {
      scoresByMatchId[matchId] = rows;
    }

    const stubWildcardModel = {
      allFieldLocked: v2View.finalsFieldLocked,
      areaReps: v2View.roster.areaReps,
      roster: v2View.roster,
    } as NationalsWildcardModel;

    return (
      <div className="space-y-6">
        <AdminBreadcrumb
          items={[
            { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
            { label: "Finals (V2)" },
          ]}
        />
        <div className="sd-page-header">
          <h1>National finals (Version 2)</h1>
          <p>
            Semifinal: Luzon vs NCR. Final: winner vs VisMin champion. Score and
            publish after all three regional rounds are complete.
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 text-sm">
            <Link href={swordDuelsPath("regionals")} className="sd-link">
              Regional scoring →
            </Link>
            <Link
              href={`${SWORD_DUELS_PUBLIC}/nationals`}
              className="sd-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Public finals map →
            </Link>
          </p>
          {!v2View.finalsFieldLocked && (
            <p className="mt-2 text-sm text-amber-200/90">
              Finals unlock when Luzon, NCR, and VisMin each finish three
              published regional rounds.
            </p>
          )}
        </div>

        <KnockoutAdminForm
          wildcardModel={stubWildcardModel}
          knockoutModel={v2View.knockoutModel}
          dbMatches={ko.matches}
          scoresByMatchId={scoresByMatchId}
        />
      </div>
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
