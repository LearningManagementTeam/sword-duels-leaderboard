"use client";

import { useState } from "react";
import { AdminActionRow } from "@/components/admin/AdminActionHint";
import { saveEventSchedule } from "@/lib/actions/admin";
import { ADMIN_SITE_HINTS } from "@/lib/admin-action-hints";
import {
  EVENT_SCHEDULE_PROGRAM_LABELS,
  type EventScheduleConfig,
  type EventScheduleEntry,
  type EventScheduleProgram,
} from "@/lib/event-schedule";

interface Props {
  initial: EventScheduleConfig;
  sdAreas: string[];
}

function toDatetimeLocalValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  if (!value) return "";
  return new Date(value).toISOString();
}

function newEntry(): EventScheduleEntry {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);
  return {
    id: crypto.randomUUID(),
    program: "sword_duels",
    title: "",
    scheduledAt: tomorrow.toISOString(),
    area: undefined,
  };
}

export function EventScheduleEditor({ initial, sdAreas }: Props) {
  const [config, setConfig] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function updateEntry(id: string, patch: Partial<EventScheduleEntry>) {
    setConfig((c) => ({
      entries: c.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeEntry(id: string) {
    setConfig((c) => ({
      entries: c.entries.filter((e) => e.id !== id),
    }));
  }

  async function handleSave() {
    const invalid = config.entries.find(
      (e) => !e.title.trim() || !e.scheduledAt || Number.isNaN(Date.parse(e.scheduledAt))
    );
    if (invalid) {
      setMessage("Each row needs a title and valid date/time.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const normalized = {
        entries: config.entries.map((e) => ({
          ...e,
          title: e.title.trim(),
        })),
      };
      const result = await saveEventSchedule(normalized);
      setConfig(result.config);
      setMessage(
        result.removed > 0
          ? `Saved. Removed ${result.removed} past event(s); home schedule updated.`
          : "Saved. Home event schedule updated."
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sd-neon-panel space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Event schedule</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Planned dates appear under <strong className="text-white">Upcoming</strong>{" "}
          on the public home page. Past events are removed when you save.{" "}
          <strong className="text-white">Recent results</strong> fill in
          automatically when area finals, wildcard, knockout matches, or NC
          rounds are published.
        </p>
      </div>

      {config.entries.length === 0 ? (
        <p className="text-sm text-sd-muted">No scheduled events yet.</p>
      ) : (
        <div className="space-y-3">
          {config.entries.map((entry) => (
            <div
              key={entry.id}
              className="sd-inset grid gap-3 rounded-lg p-4 sm:grid-cols-2"
            >
              <label className="block text-sm sm:col-span-2">
                <span className="text-sd-muted">Title</span>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) =>
                    updateEntry(entry.id, { title: e.target.value })
                  }
                  placeholder="e.g. Area 1 representative selection"
                  className="mt-1 block w-full rounded sd-input px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="text-sd-muted">Program</span>
                <select
                  value={entry.program}
                  onChange={(e) =>
                    updateEntry(entry.id, {
                      program: e.target.value as EventScheduleProgram,
                      area:
                        e.target.value === "sword_duels"
                          ? entry.area
                          : undefined,
                    })
                  }
                  className="mt-1 block w-full rounded sd-input px-3 py-2"
                >
                  {(
                    Object.keys(
                      EVENT_SCHEDULE_PROGRAM_LABELS
                    ) as EventScheduleProgram[]
                  ).map((program) => (
                    <option key={program} value={program}>
                      {EVENT_SCHEDULE_PROGRAM_LABELS[program]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-sd-muted">Date & time</span>
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(entry.scheduledAt)}
                  onChange={(e) =>
                    updateEntry(entry.id, {
                      scheduledAt: fromDatetimeLocalValue(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded sd-input px-3 py-2"
                />
              </label>

              {entry.program === "sword_duels" && (
                <label className="block text-sm sm:col-span-2">
                  <span className="text-sd-muted">Area (optional)</span>
                  <select
                    value={entry.area ?? ""}
                    onChange={(e) =>
                      updateEntry(entry.id, {
                        area: e.target.value || undefined,
                      })
                    }
                    className="mt-1 block w-full max-w-xs rounded sd-input px-3 py-2"
                  >
                    <option value="">All areas / nationals</option>
                    {sdAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-xs text-red-300/90 hover:text-red-200"
                >
                  Remove row
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setConfig((c) => ({ entries: [...c.entries, newEntry()] }))
          }
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
        >
          Add event
        </button>
      </div>

      <AdminActionRow hint={ADMIN_SITE_HINTS.saveEventSchedule}>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSave()}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save schedule"}
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
