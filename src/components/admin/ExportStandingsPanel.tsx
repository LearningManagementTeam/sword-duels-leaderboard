import { REGION_LABELS, type Region } from "@/lib/scoring-config";

const regionalExports: { phase: string; region: Region }[] = [
  { phase: "june", region: "luzon" },
  { phase: "june", region: "ncr" },
  { phase: "june", region: "vismin" },
  { phase: "july", region: "luzon" },
  { phase: "july", region: "ncr" },
  { phase: "july", region: "vismin" },
];

export function ExportStandingsPanel() {
  return (
    <section className="sd-neon-panel space-y-4 p-5" id="export">
      <div>
        <h2 className="font-semibold text-sd-glow">Export standings (CSV)</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Download published standings for reporting. Requires admin sign-in.
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/60">
            June · by region
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {regionalExports
              .filter((e) => e.phase === "june")
              .map((e) => (
                <a
                  key={`${e.phase}-${e.region}`}
                  href={`/api/export/${e.phase}?region=${e.region}`}
                  className="sd-btn-ghost rounded-lg px-3 py-1.5 text-sm"
                >
                  {REGION_LABELS[e.region]}
                </a>
              ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/60">
            July · by region
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {regionalExports
              .filter((e) => e.phase === "july")
              .map((e) => (
                <a
                  key={`${e.phase}-${e.region}`}
                  href={`/api/export/${e.phase}?region=${e.region}`}
                  className="sd-btn-ghost rounded-lg px-3 py-1.5 text-sm"
                >
                  {REGION_LABELS[e.region]}
                </a>
              ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/60">
            August · finals
          </p>
          <div className="mt-2">
            <a
              href="/api/export/august"
              className="sd-btn-ghost inline-block rounded-lg px-3 py-1.5 text-sm"
            >
              Download finals CSV
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
