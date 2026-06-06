"use client";

import { useMemo, useRef, useState } from "react";
import { saveSdAreaSchedulesForm } from "@/lib/actions/sword-duels-admin";
import type {
  SdAreaScheduleDates,
  SdAreaSchedulesConfig,
} from "@/lib/products/sword-duels/area-schedules";
import {
  mergeCsvIntoSdAreaSchedules,
  parseSdAreaSchedulesCsv,
  SD_AREA_SCHEDULE_CSV_TEMPLATE,
} from "@/lib/products/sword-duels/sd-area-schedules-csv";
import { SdButton } from "@/components/ui/SdButton";

interface Props {
  areas: string[];
  initial: SdAreaSchedulesConfig;
}

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

function emptyDates(): SdAreaScheduleDates {
  return {};
}

export function SdAreaSchedulesEditor({ areas, initial }: Props) {
  const [config, setConfig] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [showCsv, setShowCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedAreas = useMemo(() => [...areas].sort(), [areas]);

  function updateArea(area: string, patch: Partial<SdAreaScheduleDates>) {
    setConfig((c) => ({
      ...c,
      byArea: {
        ...c.byArea,
        [area]: { ...(c.byArea[area] ?? emptyDates()), ...patch },
      },
    }));
  }

  function updateNationals(
    patch: Partial<SdAreaSchedulesConfig["nationals"]>
  ) {
    setConfig((c) => ({
      ...c,
      nationals: { ...c.nationals, ...patch },
    }));
  }

  function handleCsvImport() {
    setError(null);
    setMessage(null);
    const { rows, errors } = parseSdAreaSchedulesCsv(csvText);
    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }
    if (rows.length === 0) {
      setError("No valid rows found in CSV.");
      return;
    }
    setConfig((c) => mergeCsvIntoSdAreaSchedules(c, rows));
    setMessage(`Imported ${rows.length} area row(s). Review and save.`);
    setCsvText("");
    setShowCsv(false);
  }

  function handleCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
      setShowCsv(true);
    };
    reader.readAsText(file);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveSdAreaSchedulesForm(config);
      setMessage("Area schedules saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="sd-neon-panel space-y-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Area battle dates</h2>
          <p className="mt-1 text-sm text-sd-muted">
            Group A, Group B, and area final times feed the home page{" "}
            <strong className="text-white">Upcoming</strong> column and each
            area&apos;s public schedule panel. Past dates for unpublished sets
            show as &quot;Awaiting results&quot; on the area map.
          </p>
        </div>

        {sortedAreas.length === 0 ? (
          <p className="text-sm text-sd-muted">
            Sync branches first — no areas loaded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-emerald-500/15 text-xs uppercase tracking-wide text-sd-muted">
                  <th className="px-2 py-2">Area</th>
                  <th className="px-2 py-2">Group A</th>
                  <th className="px-2 py-2">Group B</th>
                  <th className="px-2 py-2">Area final</th>
                </tr>
              </thead>
              <tbody>
                {sortedAreas.map((area) => {
                  const dates = config.byArea[area] ?? emptyDates();
                  return (
                    <tr
                      key={area}
                      className="border-b border-emerald-500/10 align-top"
                    >
                      <td className="px-2 py-3 font-medium text-white">
                        {area}
                      </td>
                      {(
                        [
                          ["groupA", "Group A battle"],
                          ["groupB", "Group B battle"],
                          ["areaFinal", "Area final"],
                        ] as const
                      ).map(([key, label]) => (
                        <td key={key} className="px-2 py-3">
                          <label className="sr-only">
                            {area} {label}
                          </label>
                          <input
                            type="datetime-local"
                            value={toDatetimeLocalValue(dates[key])}
                            onChange={(e) =>
                              updateArea(area, {
                                [key]: fromDatetimeLocalValue(e.target.value),
                              })
                            }
                            className="w-full min-w-[11rem] rounded sd-input px-2 py-1.5 text-xs"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="sd-neon-panel space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Bulk CSV import</h2>
            <p className="mt-1 text-sm text-sd-muted">
              Columns: <code className="text-fuchsia-200/80">area</code>,{" "}
              <code className="text-fuchsia-200/80">group_a</code>,{" "}
              <code className="text-fuchsia-200/80">group_b</code>,{" "}
              <code className="text-fuchsia-200/80">area_final</code>. Dates
              merge into existing rows; save to publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SdButton
              type="button"
              variant="ghost"
              onClick={() => setShowCsv((v) => !v)}
            >
              {showCsv ? "Hide CSV" : "Paste CSV"}
            </SdButton>
            <SdButton
              type="button"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload file
            </SdButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCsvFile(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {showCsv && (
          <div className="space-y-3">
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              placeholder={SD_AREA_SCHEDULE_CSV_TEMPLATE}
              className="block w-full rounded sd-input px-3 py-2 font-mono text-xs"
            />
            <SdButton
              type="button"
              disabled={!csvText.trim()}
              onClick={handleCsvImport}
            >
              Import into table
            </SdButton>
          </div>
        )}
      </section>

      <section className="sd-neon-panel space-y-4 p-5">
        <h2 className="text-lg font-semibold text-white">Nationals dates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-sd-muted">Wild card</span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(config.nationals.wildcard)}
              onChange={(e) =>
                updateNationals({
                  wildcard: fromDatetimeLocalValue(e.target.value),
                })
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-sd-muted">Knockout</span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(config.nationals.knockout)}
              onChange={(e) =>
                updateNationals({
                  knockout: fromDatetimeLocalValue(e.target.value),
                })
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <SdButton type="button" disabled={busy} onClick={() => void handleSave()}>
          Save schedules
        </SdButton>
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
