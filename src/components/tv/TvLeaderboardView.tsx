"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { StandingRow } from "@/lib/types";
import type { SeasonSlug } from "@/lib/scoring-config";

const REGIONS: Region[] = ["luzon", "ncr", "vismin"];

interface Props {
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

  const survivorRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.status !== "eliminated" && r.rank <= advancementCutoff
      ),
    [rows, advancementCutoff]
  );

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-amber-400">
            Sword Duels — {phase.toUpperCase()}
            {phase !== "august" && (
              <span className="ml-3 text-2xl text-amber-200/80">
                {REGION_LABELS[region]}
              </span>
            )}
          </h1>
          {lastPublished && (
            <p className="mt-2 text-lg text-slate-400">
              Updated:{" "}
              {new Date(lastPublished).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
        {rotateSec >= 10 && phase !== "august" && (
          <p className="text-sm text-amber-200/80">
            Auto-rotate regions every {rotateSec}s
          </p>
        )}
      </div>

      <LeaderboardTable
        rows={survivorRows}
        advancementCutoff={advancementCutoff}
        cutLineLabel={cutLineLabel}
        showArea={showArea}
        showRepresentatives={false}
        tvMode
        compact
        seasonSlug={seasonSlug}
        latestPublishedRound={latestPublishedRound}
      />
    </div>
  );
}
