import Link from "next/link";
import { swordDuelsPath } from "@/lib/admin-routes";
import type { NationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import type { SdKnockoutBracket } from "@/lib/products/sword-duels/types";

interface Props {
  model: NationalsWildcardModel;
  knockoutBracket: SdKnockoutBracket | null;
}

export function SdNationalsPhaseStrip({ model, knockoutBracket }: Props) {
  const areasDone = model.roster.publishedAreaCount;
  const totalAreas = model.roster.totalAreaCount;

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
