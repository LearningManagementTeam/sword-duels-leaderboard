"use client";

import { useMemo, useRef, useState } from "react";
import { AdminActionRow } from "@/components/admin/AdminActionHint";
import { EventsCalendarInteractive } from "@/components/events-calendar/EventsCalendarInteractive";
import { saveEventsCalendarForm } from "@/lib/actions/sword-duels-admin";
import { ADMIN_SITE_HINTS } from "@/lib/admin-action-hints";
import {
  buildEventsCalendarCsvTemplate,
  eventsCalendarToCsv,
  importEventsCalendarCsv,
  sortCalendarEvents,
  EVENTS_CALENDAR_CSV_TEMPLATE,
} from "@/lib/events-calendar-csv";
import {
  buildDefaultEventsCalendar2026,
  CALENDAR_KIND_LABELS,
  newCalendarEvent,
  type CalendarEvent,
  type CalendarEventKind,
  type EventsCalendarConfig,
} from "@/lib/events-calendar";
import { sortAreasByNumber } from "@/lib/products/sword-duels/area-groups";
import type { EventScheduleProgram } from "@/lib/event-schedule";

interface Props {
  initial: EventsCalendarConfig;
  areas: string[];
}

const KIND_OPTIONS: CalendarEventKind[] = [
  "preparation",
  "branch_duels",
  "branch_selection",
  "area_duels",
  "regional_duel",
  "custom",
];

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function toDatetimeLocal(iso: string): string {
  if (iso.length === 10) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function EventsCalendarEditor({ initial, areas }: Props) {
  const sortedAreas = useMemo(() => sortAreasByNumber(areas), [areas]);
  const [config, setConfig] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [csvError, setCsvError] = useState("");
  const [csvText, setCsvText] = useState("");
  const [showCsv, setShowCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.events[0]?.id ?? null
  );
  const [filter, setFilter] = useState<"all" | "macro" | "area">("all");

  const selected = config.events.find((e) => e.id === selectedId) ?? null;

  const filteredEvents = useMemo(() => {
    let list = config.events;
    if (filter === "macro") {
      list = list.filter((e) => !e.areas?.length);
    } else if (filter === "area") {
      list = list.filter((e) => e.areas?.length);
    }
    return sortCalendarEvents(list);
  }, [config.events, filter]);

  function updateEvent(id: string, patch: Partial<CalendarEvent>) {
    setConfig((c) => ({
      events: c.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }

  function removeEvent(id: string) {
    setConfig((c) => ({
      events: c.events.filter((e) => e.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  }

  async function handleSave() {
    const invalid = config.events.find(
      (e) => !e.title.trim() || !e.startAt || Number.isNaN(Date.parse(e.startAt.length === 10 ? `${e.startAt}T00:00:00+08:00` : e.startAt))
    );
    if (invalid) {
      setMessage("Each event needs a title and valid start date.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await saveEventsCalendarForm(config);
      setMessage("Saved. Public calendar updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function loadTemplate() {
    if (
      !window.confirm(
        "Replace all calendar events with the 2026 Branch Duels template? Unsaved changes will be lost."
      )
    ) {
      return;
    }
    const template = buildDefaultEventsCalendar2026();
    setConfig(template);
    setSelectedId(template.events[0]?.id ?? null);
    setMessage("Template loaded — click Save to publish.");
  }

  function publishAll(published: boolean) {
    setConfig((c) => ({
      events: c.events.map((e) => ({ ...e, published })),
    }));
  }

  function handleCsvImport() {
    setCsvError("");
    const { config: imported, errors } = importEventsCalendarCsv(csvText);
    if (errors.length > 0) {
      setCsvError(errors.join(" "));
      return;
    }
    if (imported.events.length === 0) {
      setCsvError("No valid rows found in CSV.");
      return;
    }
    if (
      config.events.length > 0 &&
      !window.confirm(
        `Replace all ${config.events.length} event(s) with ${imported.events.length} imported row(s)?`
      )
    ) {
      return;
    }
    setConfig(imported);
    setSelectedId(imported.events[0]?.id ?? null);
    setMessage(`Imported ${imported.events.length} event(s). Review and save.`);
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

  return (
    <div className="space-y-6">
      <section className="sd-neon-panel space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Events calendar</h2>
            <p className="mt-1 max-w-2xl text-sm text-sd-muted">
              Month grid and branch-duel table for fans at{" "}
              <strong className="text-white">/sword-duels/calendar</strong>.
              Only rows marked <strong className="text-white">Published</strong>{" "}
              appear publicly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadTemplate}
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:text-white"
            >
              Load 2026 template
            </button>
            <button
              type="button"
              onClick={() => publishAll(true)}
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-lime-200/90 hover:text-white"
            >
              Publish all
            </button>
            <button
              type="button"
              onClick={() => publishAll(false)}
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:text-white"
            >
              Unpublish all
            </button>
          </div>
        </div>

        <AdminActionRow hint={ADMIN_SITE_HINTS.saveEventsCalendar}>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="sd-btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save calendar"}
          </button>
        </AdminActionRow>
        {message && (
          <p className="text-sm text-lime-200/90" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="sd-neon-panel space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">CSV import</h2>
            <p className="mt-1 max-w-2xl text-sm text-sd-muted">
              Download the template, fill it in Excel, then upload or paste.
              Columns:{" "}
              <code className="text-fuchsia-200/80">kind</code>,{" "}
              <code className="text-fuchsia-200/80">title</code>,{" "}
              <code className="text-fuchsia-200/80">start_date</code>,{" "}
              <code className="text-fuchsia-200/80">end_date</code>,{" "}
              <code className="text-fuchsia-200/80">start_time</code>,{" "}
              <code className="text-fuchsia-200/80">time_label</code>,{" "}
              <code className="text-fuchsia-200/80">area</code>,{" "}
              <code className="text-fuchsia-200/80">set_label</code>,{" "}
              <code className="text-fuchsia-200/80">published</code>,{" "}
              <code className="text-fuchsia-200/80">program</code>.
              Import replaces all events in the editor — save to publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "sword-duels-calendar-template-2026.csv",
                  buildEventsCalendarCsvTemplate()
                )
              }
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-cyan-200 hover:text-white"
            >
              Download template
            </button>
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "sword-duels-calendar-export.csv",
                  eventsCalendarToCsv(config)
                )
              }
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:text-white"
            >
              Export current
            </button>
            <button
              type="button"
              onClick={() => setShowCsv((v) => !v)}
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:text-white"
            >
              {showCsv ? "Hide CSV" : "Paste CSV"}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-sd-muted hover:text-white"
            >
              Upload file
            </button>
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
              rows={8}
              placeholder={EVENTS_CALENDAR_CSV_TEMPLATE.slice(0, 500) + "…"}
              className="block w-full rounded sd-input px-3 py-2 font-mono text-xs"
            />
            <button
              type="button"
              disabled={!csvText.trim()}
              onClick={handleCsvImport}
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-lime-200 hover:text-white disabled:opacity-50"
            >
              Import CSV
            </button>
          </div>
        )}
        {csvError && (
          <p className="text-sm text-red-300" role="alert">
            {csvError}
          </p>
        )}
      </section>

      <EventsCalendarInteractive
        events={config.events.filter((e) => e.published)}
        mode="admin"
        initialMonth={{ year: 2026, month: 5 }}
      />

      <section className="sd-neon-panel space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">All events</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "macro", "area"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                  filter === f
                    ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-400/40"
                    : "sd-glass text-sd-muted hover:text-white"
                }`}
              >
                {f === "all" ? "All" : f === "macro" ? "Calendar blocks" : "Per area"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const ev = newCalendarEvent();
                setConfig((c) => ({ events: [...c.events, ev] }));
                setSelectedId(ev.id);
              }}
              className="sd-glass rounded-lg px-3 py-1.5 text-sm text-cyan-200 hover:text-white"
            >
              + Add event
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-emerald-500/15">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-sd-panel/95 text-[10px] uppercase tracking-wider text-sd-muted">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Pub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={`cursor-pointer transition hover:bg-emerald-500/5 ${
                      selectedId === event.id ? "bg-cyan-400/10" : ""
                    }`}
                    onClick={() => setSelectedId(event.id)}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-sd-muted">
                      {toDateInput(event.startAt)}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-white">{event.title}</p>
                      {event.areas?.[0] && (
                        <p className="text-xs text-sd-muted">{event.areas[0]}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={event.published}
                        onChange={(ev) =>
                          updateEvent(event.id, {
                            published: ev.target.checked,
                          })
                        }
                        onClick={(ev) => ev.stopPropagation()}
                        aria-label={`Published: ${event.title}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected ? (
            <form
              className="space-y-3 rounded-xl border border-emerald-500/15 bg-sd-deep/30 p-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <h3 className="font-semibold text-white">Edit event</h3>

              <label className="block text-xs text-sd-muted">
                Title
                <input
                  className="sd-input mt-1 w-full"
                  value={selected.title}
                  onChange={(e) =>
                    updateEvent(selected.id, { title: e.target.value })
                  }
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-sd-muted">
                  Kind
                  <select
                    className="sd-input mt-1 w-full"
                    value={selected.kind}
                    onChange={(e) =>
                      updateEvent(selected.id, {
                        kind: e.target.value as CalendarEventKind,
                      })
                    }
                  >
                    {KIND_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {CALENDAR_KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-sd-muted">
                  Program
                  <select
                    className="sd-input mt-1 w-full"
                    value={selected.program}
                    onChange={(e) =>
                      updateEvent(selected.id, {
                        program: e.target.value as EventScheduleProgram,
                      })
                    }
                  >
                    <option value="sword_duels">Sword Duels</option>
                    <option value="national_competitions">
                      National Competitions
                    </option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-sd-muted">
                  Start date
                  <input
                    type="date"
                    className="sd-input mt-1 w-full"
                    value={toDateInput(selected.startAt)}
                    onChange={(e) => {
                      const timePart =
                        selected.startAt.length > 10
                          ? selected.startAt.slice(10)
                          : "";
                      updateEvent(selected.id, {
                        startAt: e.target.value + timePart,
                      });
                    }}
                  />
                </label>
                <label className="block text-xs text-sd-muted">
                  End date (multi-day)
                  <input
                    type="date"
                    className="sd-input mt-1 w-full"
                    value={selected.endAt ?? ""}
                    onChange={(e) =>
                      updateEvent(selected.id, {
                        endAt: e.target.value || undefined,
                      })
                    }
                  />
                </label>
              </div>

              <label className="block text-xs text-sd-muted">
                Time (optional — for exact slot)
                <input
                  type="datetime-local"
                  className="sd-input mt-1 w-full"
                  value={toDatetimeLocal(selected.startAt)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    updateEvent(selected.id, {
                      startAt: new Date(e.target.value).toISOString(),
                    });
                  }}
                />
              </label>

              <label className="block text-xs text-sd-muted">
                Time label (display)
                <input
                  className="sd-input mt-1 w-full"
                  placeholder="10:00 AM & 11:00 AM"
                  value={selected.timeLabel ?? ""}
                  onChange={(e) =>
                    updateEvent(selected.id, {
                      timeLabel: e.target.value || undefined,
                    })
                  }
                />
              </label>

              <label className="block text-xs text-sd-muted">
                Area
                <select
                  className="sd-input mt-1 w-full"
                  value={selected.areas?.[0] ?? ""}
                  onChange={(e) =>
                    updateEvent(selected.id, {
                      areas: e.target.value ? [e.target.value] : undefined,
                    })
                  }
                >
                  <option value="">— All / macro event —</option>
                  {sortedAreas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-sd-muted">
                Set label
                <input
                  className="sd-input mt-1 w-full"
                  placeholder="SET 1 & 2"
                  value={selected.setLabel ?? ""}
                  onChange={(e) =>
                    updateEvent(selected.id, {
                      setLabel: e.target.value || undefined,
                    })
                  }
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={selected.published}
                  onChange={(e) =>
                    updateEvent(selected.id, { published: e.target.checked })
                  }
                />
                Published on public calendar
              </label>

              <button
                type="button"
                onClick={() => removeEvent(selected.id)}
                className="text-sm text-red-300/90 hover:text-red-200"
              >
                Delete event
              </button>
            </form>
          ) : (
            <p className="text-sm text-sd-muted">
              Select an event from the table to edit.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
