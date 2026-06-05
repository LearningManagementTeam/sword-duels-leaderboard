"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PreviewBanner } from "@/components/PreviewBanner";
import { NationalsWildcardMap } from "@/components/sword-duels/NationalsWildcardMap";
import { useWildcardPreviewState } from "@/components/sword-duels/useWildcardPreviewState";
import { buildNationalsWildcardModel } from "@/lib/products/sword-duels/build-nationals-wildcard-model";
import { swordDuelsPath, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

export function NationalsWildcardPreviewClient() {
  const { state, hydrated } = useWildcardPreviewState();

  const model = useMemo(
    () => buildNationalsWildcardModel(state),
    [state]
  );

  if (!hydrated) {
    return (
      <p className="text-sm text-sd-muted">Loading nationals preview…</p>
    );
  }

  return (
    <div className="space-y-6">
      <PreviewBanner />
      <div className="sd-alert-warning border-fuchsia-500/30 bg-fuchsia-950/30 text-fuchsia-100">
        <p className="font-medium">Temporary preview — placeholder reps & wildcard demo</p>
        <p className="mt-1 text-sm opacity-90">
          Not connected to live area finals. Wildcard scores are set in{" "}
          <Link
            href={swordDuelsPath("preview", "nationals-wildcard")}
            className="underline"
          >
            admin preview
          </Link>
          .
        </p>
      </div>

      <NationalsWildcardMap
        model={model}
        scores={state.wildcardScores}
        confirmedWildcardId={state.confirmedWildcardId}
      />

      <p className="text-center text-sm text-sd-muted">
        <Link href={SWORD_DUELS_PUBLIC} className="sd-link">
          ← Back to Sword Duels
        </Link>
      </p>
    </div>
  );
}
