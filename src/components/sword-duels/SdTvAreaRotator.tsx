"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import {
  sdNationalsTvDefaultView,
  type SdTournamentFormat,
} from "@/lib/products/sword-duels/tournament-format";

interface Props {
  areas: string[];
  currentArea: string;
  rotateSec: number;
  tournamentFormat?: SdTournamentFormat | null;
}

export function SdTvAreaRotator({
  areas,
  currentArea,
  rotateSec,
  tournamentFormat,
}: Props) {
  const nationalsView = sdNationalsTvDefaultView(tournamentFormat);
  const router = useRouter();

  useEffect(() => {
    if (!rotateSec || rotateSec < 10 || areas.length < 2) return;
    const id = setInterval(() => {
      const i = areas.indexOf(currentArea);
      const next = areas[(i + 1) % areas.length];
      router.push(
        `/sword-duels/tv?area=${encodeURIComponent(next)}&rotate=${rotateSec}`
      );
    }, rotateSec * 1000);
    return () => clearInterval(id);
  }, [rotateSec, currentArea, areas, router]);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {areas.map((a) => (
          <Link
            key={a}
            href={`/sword-duels/tv?area=${encodeURIComponent(a)}${
              rotateSec ? `&rotate=${rotateSec}` : ""
            }`}
            className={`rounded-xl px-3 py-1.5 transition ${
              a === currentArea
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                : "sd-glass text-sd-muted hover:text-white"
            }`}
          >
            {a}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/sword-duels/tv?area=${encodeURIComponent(currentArea)}&rotate=60`}
          className="text-sd-muted hover:text-sd-glow"
        >
          Rotate 60s
        </Link>
        {rotateSec > 0 && (
          <Link
            href={`/sword-duels/tv?area=${encodeURIComponent(currentArea)}`}
            className="text-sd-muted hover:text-sd-glow"
          >
            Stop rotate
          </Link>
        )}
        <Link href={`/sword-duels/${areaSlug(currentArea)}`} className="text-sd-muted hover:text-sd-glow">
          Standard view
        </Link>
        <Link
          href={`/sword-duels/tv?mode=nationals&view=${nationalsView}`}
          className="text-sd-muted hover:text-sd-glow"
        >
          Nationals TV
        </Link>
        <Link
          href="/sword-duels/tv?mode=event&rotate=90"
          className="text-sd-muted hover:text-sd-glow"
        >
          Full event rotate
        </Link>
        <span className="text-sd-muted/70">Auto-refresh 30s</span>
      </div>
    </div>
  );
}
