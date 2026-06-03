"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GamifiedLeaderboard } from "@/components/leaderboard/GamifiedLeaderboard";
import type { BrandingConfig } from "@/lib/branding";
import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

const REGIONS: Region[] = ["luzon", "ncr", "vismin"];

interface Props {
  branding: BrandingConfig;
  phase: string;
  initialRegion: Region;
  rows: StandingRow[];
  seasonSlug: SeasonSlug;
  latestPublishedRound: number;
  advancementCutoff: number;
  cutLineLabel?: string;
  lastPublished: string | null;
  showArea: boolean;
}

export function TvLeaderboardView({
  branding,
  phase,
  initialRegion,
  rows,
  seasonSlug,
  latestPublishedRound,
  advancementCutoff,
  cutLineLabel,
  lastPublished,
  showArea,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rotateSec = parseInt(searchParams.get("rotate") ?? "0", 10);
  const [region, setRegion] = useState<Region>(initialRegion);

  const displayRows = useMemo(
    () =>
      rows.filter(
        (r) => r.status !== "eliminated" && r.rank <= advancementCutoff
      ),
    [rows, advancementCutoff]
  );

  const subtitle =
    phase === "august"
      ? `August Finals${
          lastPublished
            ? ` · ${new Date(lastPublished).toLocaleString("en-PH", { timeStyle: "short", dateStyle: "short" })}`
            : ""
        }`
      : `${phase.toUpperCase()} · ${REGION_LABELS[region]}${
          latestPublishedRound > 0 ? ` · Round ${latestPublishedRound}` : ""
        }${
          lastPublished
            ? ` · ${new Date(lastPublished).toLocaleString("en-PH", { timeStyle: "short", dateStyle: "short" })}`
            : ""
        }`;

  useEffect(() => {
    if (!rotateSec || rotateSec < 10 || phase === "august") return;
    const id = setInterval(() => {
      setRegion((r) => {
        const i = REGIONS.indexOf(r);
        const next = REGIONS[(i + 1) % REGIONS.length];
        const params = new URLSearchParams(searchParams.toString());
        params.set("region", next);
        router.replace(`/tv?${params.toString()}`, { scroll: false });
        return next;
      });
    }, rotateSec * 1000);
    return () => clearInterval(id);
  }, [rotateSec, phase, router, searchParams]);

  useEffect(() => {
    setRegion(initialRegion);
  }, [initialRegion]);

  return (
    <div className="space-y-4">
      {rotateSec >= 10 && phase !== "august" && (
        <p className="text-center text-sm text-sd-glow">
          Auto-rotate regions every {rotateSec}s
        </p>
      )}
      <GamifiedLeaderboard
        branding={branding}
        bannerSubtitle={subtitle}
        rows={displayRows}
        advancementCutoff={advancementCutoff}
        cutLineLabel={cutLineLabel}
        showArea={showArea}
        showRepresentatives={false}
        tvMode
        showDetailToggle={false}
        seasonSlug={seasonSlug}
        latestPublishedRound={latestPublishedRound}
      />
    </div>
  );
}
