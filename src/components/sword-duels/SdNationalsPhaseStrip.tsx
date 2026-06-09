import Link from "next/link";
import { swordDuelsPath } from "@/lib/admin-routes";
import type { NationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import {
  isRegionalAverageFormat,
  type SdTournamentFormat,
} from "@/lib/products/sword-duels/tournament-format";
import type { SdKnockoutBracket } from "@/lib/products/sword-duels/types";

interface Props {
  format: SdTournamentFormat;
  areasDone: number;
  totalAreas: number;
  knockoutBracket: SdKnockoutBracket | null;
  /** V1 — wild card model */
  wildcardModel?: NationalsWildcardModel;
  /** V2 — published regional round count */
  regionalPublished?: number;
  regionalTotal?: number;
}

export function SdNationalsPhaseStrip({
  format,
  areasDone,
  totalAreas,
  knockoutBracket,
  wildcardModel,
  regionalPublished = 0,
  regionalTotal = 9,
}: Props) {
  const isV2 = isRegionalAverageFormat(format);

  if (isV2) {
    let regionalLabel = "Awaiting area finals";
    if (areasDone === totalAreas && regionalPublished === 0) {
      regionalLabel = "Ready to score";
    } else if (regionalPublished > 0 && regionalPublished < regionalTotal) {
      regionalLabel = `${regionalPublished} / ${regionalTotal} rounds published`;
    } else if (regionalPublished >= regionalTotal) {
      regionalLabel = "All regional rounds complete";
    }

    let finalsLabel = "Finals pending";
    if (knockoutBracket?.status === "complete") {
      finalsLabel = "National champion crowned";
    } else if (knockoutBracket?.status === "active") {
      finalsLabel = "Finals in progress";
    } else if (regionalPublished >= regionalTotal) {
      finalsLabel = "Ready to score finals";
    }

    return (
      <section className="sd-neon-panel grid gap-3 p-4 sm:grid-cols-3">
        <PhaseCell
          title="Area finals"
          value={`${areasDone} / ${totalAreas}`}
          detail={areasDone === totalAreas ? "All reps locked" : "Publish area finals"}
          href={swordDuelsPath("areas")}
        />
        <PhaseCell
          title="Regional rounds"
          value={regionalLabel}
          detail="Luzon · NCR · VisMin · 3 rounds each"
          href={swordDuelsPath("regionals")}
        />
        <PhaseCell
          title="National finals"
          value={finalsLabel}
          detail="Semifinal + final"
          href={swordDuelsPath("nationals")}
        />
      </section>
    );
  }

  const model = wildcardModel;
  if (!model) return null;

  let wildcardLabel = "Awaiting area finals";
  if (model.allFieldLocked) {
    wildcardLabel = "Wild card locked";
  } else if (model.phase === "tiebreak_pending") {
    wildcardLabel = "Wildcard tiebreak in progress";
  } else if (model.phase === "auto_wildcard" || model.phase === "tiebreak_resolved") {
    wildcardLabel = "Wild card resolved";
  } else if (areasDone === totalAreas) {
    wildcardLabel = "Resolving wild card";
  }

  let knockoutLabel = "Knockout pending";
  if (knockoutBracket?.status === "complete") {
    knockoutLabel = "National champion crowned";
  } else if (knockoutBracket?.status === "active") {
    knockoutLabel = "Knockout in progress";
  } else if (model.allFieldLocked) {
    knockoutLabel = "Ready to sync knockout";
  }

  return (
    <section className="sd-neon-panel grid gap-3 p-4 sm:grid-cols-3">
      <PhaseCell
        title="Area finals"
        value={`${areasDone} / ${totalAreas}`}
        detail={areasDone === totalAreas ? "All reps locked" : "Publish area finals"}
        href={swordDuelsPath("areas")}
      />
      <PhaseCell
        title="Wild card"
        value={wildcardLabel}
        detail={`Slot ${model.targetFieldSize}`}
        href={swordDuelsPath("nationals")}
      />
      <PhaseCell
        title="Knockout"
        value={knockoutLabel}
        detail="Area vs area bracket"
        href={swordDuelsPath("nationals")}
      />
    </section>
  );
}

function PhaseCell({
  title,
  value,
  detail,
  href,
}: {
  title: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg bg-sd-deep/30 p-3 transition hover:ring-1 hover:ring-cyan-400/25"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-sd-glow">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-sd-muted">{detail}</p>
    </Link>
  );
}
