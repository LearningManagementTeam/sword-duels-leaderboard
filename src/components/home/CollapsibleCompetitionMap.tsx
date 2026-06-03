import { CompetitionMapPanel } from "@/components/competition/CompetitionMapPanel";

export async function CollapsibleCompetitionMap() {
  return (
    <details className="group sd-glass-strong rounded-2xl">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-sd-muted/70">
              Season journey
            </span>
            <span className="mt-0.5 block text-base text-sd-glow">
              Show the path to the crown
            </span>
          </span>
          <span className="text-sd-muted transition group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>
      <div className="border-t border-emerald-500/10 px-2 pb-2 pt-2 sm:px-3">
        <CompetitionMapPanel />
      </div>
    </details>
  );
}
