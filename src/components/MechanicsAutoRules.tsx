import {
  getJuneSurvivorTable,
  getJulySurvivorTable,
  getPhaseOverviewRows,
  getRoundCapRows,
  STATUS_GLOSSARY,
  TIE_BREAKER_LABELS,
} from "@/lib/mechanics-rules";

export function MechanicsAutoRules() {
  const phases = getPhaseOverviewRows();
  const june = getJuneSurvivorTable();
  const july = getJulySurvivorTable();
  const caps = getRoundCapRows();

  return (
    <div className="space-y-10">
      <section id="phases">
        <h2 className="text-xl font-semibold text-sd-glow">Phases</h2>
        <p className="mt-1 text-sm text-slate-500">
          Generated from system rules — updates automatically when competition
          config changes.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-3 py-2">Phase</th>
                <th className="px-3 py-2">Participants</th>
                <th className="px-3 py-2">Rounds</th>
                <th className="px-3 py-2">Advancement</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((p) => (
                <tr key={p.phase} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-medium text-white">
                    <a href={`#${p.anchor}`} className="hover:text-amber-300">
                      {p.phase}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{p.participants}</td>
                  <td className="px-3 py-2 text-slate-300">{p.rounds}</td>
                  <td className="px-3 py-2 text-slate-300">{p.advancement}</td>
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
        <p className="mt-2 text-sm text-slate-400">
          Each round uses that round&apos;s score only (not cumulative). Within
          each region:
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-300">
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
                <tr key={row.round} className="border-t border-slate-800">
                  <td className="px-3 py-2">Round {row.round}</td>
                  <td className="px-3 py-2">top {row.luzon}</td>
                  <td className="px-3 py-2">top {row.ncr}</td>
                  <td className="px-3 py-2">top {row.vismin}</td>
                  <td className="px-3 py-2 font-medium text-amber-200/90">
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
        <p className="mt-2 text-sm text-slate-400">
          Starting pool: 8 per region (24 total from June).
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-3 py-2">After round</th>
                <th className="px-3 py-2">Per region</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {july.map((row) => (
                <tr key={row.round} className="border-t border-slate-800">
                  <td className="px-3 py-2">Round {row.round}</td>
                  <td className="px-3 py-2">top {row.perRegion}</td>
                  <td className="px-3 py-2 font-medium text-amber-200/90">
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
        <p className="text-sm text-slate-400">
          Three regional champions compete in a single-day event. Scoring format
          to be confirmed.
        </p>
      </section>

      {caps.length > 0 && (
        <section id="caps">
          <h2 className="text-xl font-semibold text-sd-glow">
            Round score caps
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-300">
                <tr>
                  <th className="px-3 py-2">Season</th>
                  <th className="px-3 py-2">Round</th>
                  <th className="px-3 py-2">Format</th>
                  <th className="px-3 py-2">Max points</th>
                </tr>
              </thead>
              <tbody>
                {caps.map((row, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="px-3 py-2">{row.season}</td>
                    <td className="px-3 py-2">{row.round}</td>
                    <td className="px-3 py-2">{row.format}</td>
                    <td className="px-3 py-2 font-medium">{row.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section id="tie-breakers">
        <h2 className="text-xl font-semibold text-sd-glow">Tie-breakers</h2>
        <p className="mt-2 text-sm text-slate-400">
          For elimination cuts within a round:
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-slate-300">
          {TIE_BREAKER_LABELS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ol>
      </section>

      <section id="statuses">
        <h2 className="text-xl font-semibold text-sd-glow">Status labels</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/80 text-slate-300">
              <tr>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_GLOSSARY.map((row) => (
                <tr key={row.status} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-medium text-white">
                    {row.status}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
