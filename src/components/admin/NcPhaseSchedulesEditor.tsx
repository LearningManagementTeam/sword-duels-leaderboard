"use client";

import { useState } from "react";
import { AdminActionRow } from "@/components/admin/AdminActionHint";
import { saveNcPhaseSchedules } from "@/lib/actions/admin";
import { ADMIN_SITE_HINTS } from "@/lib/admin-action-hints";
import {
  type NcPhaseSchedulesConfig,
  type NcRoundScheduleDates,
} from "@/lib/nc-phase-schedules";

interface Props {
  initial: NcPhaseSchedulesConfig;
}

const PHASES: {
  key: keyof NcPhaseSchedulesConfig;
  label: string;
}[] = [
  { key: "june", label: "June (area-wide)" },
  { key: "july", label: "July (regional)" },
  { key: "august", label: "The Nationals" },
];

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

export function NcPhaseSchedulesEditor({ initial }: Props) {
  const [config, setConfig] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function updatePhase(
    phase: keyof NcPhaseSchedulesConfig,
    patch: Partial<NcRoundScheduleDates>
  ) {
    setConfig((c) => ({
      ...c,
      [phase]: { ...c[phase], ...patch },
    }));
  }

  async function handleSave() {
    setLoading(true);
    setMessage("");
    try {
      await saveNcPhaseSchedules(config);
      setMessage("Saved. NC round dates updated on the home page.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sd-neon-panel space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">NC phase schedules</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Round dates for June, July, and The Nationals appear in{" "}
          <strong className="text-white">Upcoming</strong> until that round is
          published. Use alongside the manual event schedule for one-off
          announcements.
        </p>
      </div>

      <div className="space-y-6">
        {PHASES.map(({ key, label }) => (
          <div key={key} className="sd-inset rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white">{label}</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {([1, 2, 3] as const).map((round) => {
                const field = `r${round}` as const;
                return (
                  <label key={field} className="block text-sm">
                    <span className="text-sd-muted">Round {round}</span>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocalValue(config[key][field])}
                      onChange={(e) =>
                        updatePhase(key, {
                          [field]: fromDatetimeLocalValue(e.target.value),
                        })
                      }
                      className="mt-1 block w-full rounded sd-input px-3 py-2"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AdminActionRow hint={ADMIN_SITE_HINTS.saveNcPhaseSchedules}>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSave()}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save NC schedules"}
        </button>
      </AdminActionRow>

      {message && (
        <p
          className={`text-sm ${message.includes("Saved") ? "text-emerald-300" : "text-amber-200"}`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
