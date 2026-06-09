"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";
import {
  SD_NATIONALS_TV_VIEW_LABELS,
  type SdNationalsTvView,
  sdNationalsTvViews,
} from "@/lib/products/sword-duels/tournament-format";
import type { SdTournamentFormat } from "@/lib/products/sword-duels/tournament-format";

interface Props {
  currentView: SdNationalsTvView;
  rotateSec: number;
  tournamentFormat?: SdTournamentFormat | null;
}

function viewHref(view: SdNationalsTvView, rotateSec: number): string {
  const params = new URLSearchParams({ mode: "nationals", view });
  if (rotateSec > 0) params.set("rotate", String(rotateSec));
  return `${SWORD_DUELS_PUBLIC}/tv?${params.toString()}`;
}

export function SdTvNationalsRotator({
  currentView,
  rotateSec,
  tournamentFormat,
}: Props) {
  const router = useRouter();
  const views = sdNationalsTvViews(tournamentFormat);

  useEffect(() => {
    if (!rotateSec || rotateSec < 10 || views.length < 2) return;
    const id = setInterval(() => {
      const i = views.indexOf(currentView);
      const next = views[(i + 1) % views.length]!;
      router.push(viewHref(next, rotateSec));
    }, rotateSec * 1000);
    return () => clearInterval(id);
  }, [rotateSec, currentView, router, views]);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {views.map((view) => (
          <Link
            key={view}
            href={viewHref(view, rotateSec)}
            className={`rounded-xl px-3 py-1.5 transition ${
              view === currentView
                ? "bg-gradient-to-r from-fuchsia-400 to-purple-400 font-semibold text-sd-deep"
                : "sd-glass text-sd-muted hover:text-white"
            }`}
          >
            {SD_NATIONALS_TV_VIEW_LABELS[view]}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={viewHref(currentView, 60)}
          className="text-sd-muted hover:text-sd-glow"
        >
          Rotate 60s
        </Link>
        {rotateSec > 0 && (
          <Link
            href={viewHref(currentView, 0)}
            className="text-sd-muted hover:text-sd-glow"
          >
            Stop rotate
          </Link>
        )}
        <Link
          href={`${SWORD_DUELS_PUBLIC}/nationals`}
          className="text-sd-muted hover:text-sd-glow"
        >
          Standard view
        </Link>
        <Link
          href={`${SWORD_DUELS_PUBLIC}/tv?mode=event&rotate=90`}
          className="text-sd-muted hover:text-sd-glow"
        >
          Full event rotate
        </Link>
      </div>
    </div>
  );
}
