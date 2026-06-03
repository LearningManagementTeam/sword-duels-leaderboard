import {
  getJuneSurvivorTable,
  getJulySurvivorTable,
  getPhaseOverviewRows,
  getRoundCapRows,
  STATUS_GLOSSARY,
  TIE_BREAKER_LABELS,
} from "@/lib/mechanics-rules";

export function MechanicsAutoRules({ branchCount = 0 }: { branchCount?: number }) {
  const phases = getPhaseOverviewRows(branchCount);
  const june = getJuneSurvivorTable();
  const july = getJulySurvivorTable();
  const caps = getRoundCapRows();

  return (
    <div className="space-y-10">
      <section id="phases">
        <h2 className="text-xl font-semibold text-sd-glow">Phases</h2>
        <p className="mt-1 text-sm text-sd-muted/70">
          Generated from system rules — updates automatically when competition
          config changes.
        </p>
        <div className="sd-table-wrap sd-inset mt-4">
          <table className="sd-table min-w-[520px]">
            <thead>
              <tr>
                <th className="px-3 py-2">Phase</th>
                <th className="px-3 py-2">Participants</th>
                <th className="px-3 py-2">Rounds</th>
                <th className="px-3 py-2">Advancement</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((p) => (
                <tr key={p.phase}>
                  <td className="font-medium text-white">
                    <a href={`#${p.anchor}`} className="sd-link">
                      {p.phase}
                    </a>
                  </td>
                  <td>{p.participants}</td>
                  <td>{p.rounds}</td>
                  <td>{p.advancement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="june">
        <h2 className="text-xl font-semibold text-sd-glow">
          June — per-round regional elimination
        </h2>
        <p className="mt-2 text-sm text-sd-muted">
          Each round uses that round&apos;s score only (not cumulative). Within
          each region:
        </p>
        <div className="sd-table-wrap sd-inset mt-4">
          <table className="sd-table min-w-[400px]">
            <thead>
              <tr>
                <th className="px-3 py-2">After round</th>
                <th className="px-3 py-2">Luzon</th>
                <th className="px-3 py-2">NCR</th>
                <th className="px-3 py-2">VisMin</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {june.map((row) => (
                <tr key={row.round}>
                  <td>Round {row.round}</td>
                  <td>top {row.luzon}</td>
                  <td>top {row.ncr}</td>
                  <td>top {row.vismin}</td>
                  <td className="font-medium text-sd-glow">
                    {row.total} {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="july">
        <h2 className="text-xl font-semibold text-sd-glow">
          July — per-round regional elimination
        </h2>
        <p className="mt-2 text-sm text-sd-muted">
          Starting pool: 8 per region (24 total from June).
        </p>
        <div className="sd-table-wrap sd-inset mt-4">
          <table className="sd-table min-w-[320px]">
            <thead>
              <tr>
                <th className="px-3 py-2">After round</th>
                <th className="px-3 py-2">Per region</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {july.map((row) => (
                <tr key={row.round}>
                  <td>Round {row.round}</td>
                  <td>top {row.perRegion}</td>
                  <td className="font-medium text-sd-glow">
                    {row.total} {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="august">
        <h2 className="text-xl font-semibold text-sd-glow">August</h2>
        <p className="text-sm text-sd-muted">
          Three regional champions compete in a single-day event. Scoring format
          to be confirmed.
        </p>
      </section>

      {caps.length > 0 && (
        <section id="caps">
          <h2 className="text-xl font-semibold text-sd-glow">
            Round score caps
          </h2>
          <div className="sd-table-wrap sd-inset mt-4">
            <table className="sd-table">
              <thead>
                <tr>
                  <th className="px-3 py-2">Season</th>
                  <th className="px-3 py-2">Round</th>
                  <th className="px-3 py-2">Format</th>
                  <th className="px-3 py-2">Max points</th>
                </tr>
              </thead>
              <tbody>
                {caps.map((row, i) => (
                  <tr key={i}>
                    <td>{row.season}</td>
                    <td>{row.round}</td>
                    <td>{row.format}</td>
                    <td className="font-medium text-sd-glow">{row.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section id="tie-breakers">
        <h2 className="text-xl font-semibold text-sd-glow">Tie-breakers</h2>
        <p className="mt-2 text-sm text-sd-muted">
          For elimination cuts within a round:
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-sd-muted">
          {TIE_BREAKER_LABELS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ol>
      </section>

      <section id="statuses">
        <h2 className="text-xl font-semibold text-sd-glow">Status labels</h2>
        <div className="sd-table-wrap sd-inset mt-4">
          <table className="sd-table">
            <thead>
              <tr>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_GLOSSARY.map((row) => (
                <tr key={row.status}>
                  <td className="font-medium text-white">{row.status}</td>
                  <td>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
