import { CompetitionMapPanel } from "@/components/competition/CompetitionMapPanel";
import type { CompetitionMapConfig } from "@/lib/competition-map";

interface Props {
  mapConfig: CompetitionMapConfig;
}

export async function CollapsibleCompetitionMap({ mapConfig }: Props) {
  return (
    <details className="group sd-glass-strong mx-auto max-w-3xl rounded-2xl">
      <summary className="cursor-pointer list-none px-5 py-4 text-center sm:px-6 sm:text-left [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-sd-muted/70">
              Season journey
            </span>
            <span className="mt-0.5 block text-base font-medium text-sd-glow">
              Show the path to the crown
            </span>
          </span>
          <span
            className="shrink-0 text-sd-muted transition group-open:rotate-180"
            aria-hidden
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="border-t border-emerald-500/10 px-2 pb-3 pt-2 sm:px-3">
        <CompetitionMapPanel config={mapConfig} />
      </div>
    </details>
  );
}
