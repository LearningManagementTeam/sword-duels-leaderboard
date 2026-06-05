import type { SdAreaBracket } from "@/lib/products/sword-duels/types";
import { SD_GROUP_SPLIT_RULE } from "@/lib/products/sword-duels/scoring-config";

function RepLine({
  rep1,
  rep2,
  emp1,
  pos1,
  emp2,
  pos2,
}: {
  rep1?: string | null;
  rep2?: string | null;
  emp1?: string | null;
  pos1?: string | null;
  emp2?: string | null;
  pos2?: string | null;
}) {
  const primary = rep1?.trim();
  const secondary = rep2?.trim();
  if (!primary && !secondary) {
    return <span className="text-sd-muted/50">No reps yet</span>;
  }
  return (
    <span className="block text-right sm:text-left">
      {primary && (
        <span className="block">
          {primary}
          {emp1?.trim() && (
            <span className="text-sd-muted/55"> · #{emp1.trim()}</span>
          )}
          {pos1?.trim() && (
            <span className="block text-[10px] text-sd-muted/55">{pos1.trim()}</span>
          )}
        </span>
      )}
      {secondary && (
        <span className="mt-0.5 block text-sd-muted/70">
          {secondary}
          {emp2?.trim() && (
            <span className="text-sd-muted/55"> · #{emp2.trim()}</span>
          )}
          {pos2?.trim() && (
            <span className="block text-[10px] text-sd-muted/55">{pos2.trim()}</span>
          )}
        </span>
      )}
    </span>
  );
}

function GroupColumn({
  label,
  branches,
  accent,
}: {
  label: string;
  branches: SdAreaBracket["groupA"];
  accent: "cyan" | "amber";
}) {
  const ring =
    accent === "cyan"
      ? "ring-cyan-400/30 border-cyan-500/20"
      : "ring-amber-400/30 border-amber-500/20";
  const badge =
    accent === "cyan"
      ? "bg-cyan-500/20 text-cyan-100"
      : "bg-amber-500/20 text-amber-100";

  return (
    <div className={`sd-inset rounded-lg border p-3 ring-1 ${ring}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${badge}`}>
          {branches.length} branches
        </span>
      </div>
      <ol className="space-y-1.5 text-xs">
        {branches.map((b, i) => (
          <li
            key={b.branch_id}
            className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-b border-emerald-500/10 pb-1.5 last:border-0"
          >
            <span className="font-medium text-white">
              <span className="mr-1.5 tabular-nums text-sd-muted/60">{i + 1}.</span>
              {b.branch_name}
              <span className="ml-1 text-sd-muted/55">({b.branch_code})</span>
            </span>
            <span className="text-[10px]">
              <RepLine
                rep1={b.representative_1}
                rep2={b.representative_2}
                emp1={b.representative_1_employee_no}
                pos1={b.representative_1_position}
                emp2={b.representative_2_employee_no}
                pos2={b.representative_2_position}
              />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AreaGroupSplitPanel({ bracket }: { bracket: SdAreaBracket }) {
  return (
    <section className="sd-neon-panel space-y-3 p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-white">Group assignment</h2>
        <p className="mt-1 text-sm text-sd-muted">{SD_GROUP_SPLIT_RULE}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <GroupColumn label="Group A — Set 1 battle" branches={bracket.groupA} accent="cyan" />
        <GroupColumn label="Group B — Set 2 battle" branches={bracket.groupB} accent="amber" />
      </div>
      <p className="text-xs text-sd-muted/70">
        Each group produces one spot. Spot 1 and Spot 2 meet in the area final for
        the single area representative.
      </p>
    </section>
  );
}
