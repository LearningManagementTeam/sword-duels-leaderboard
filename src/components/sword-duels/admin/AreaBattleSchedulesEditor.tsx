"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { saveSdAreaBattleScheduleAction } from "@/lib/actions/sword-duels-admin";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/products/sword-duels/area-schedule-input";
import type { SdAreaScheduleDates } from "@/lib/products/sword-duels/area-schedules";

const BATTLE_FIELDS = [
  {
    setKey: "group_a" as const,
    dateKey: "groupA" as const,
    hostKey: "hostGroupA" as const,
    title: "Set 1 — Group A battle",
    hint: "All branches in Group A compete for Spot 1.",
  },
  {
    setKey: "group_b" as const,
    dateKey: "groupB" as const,
    hostKey: "hostGroupB" as const,
    title: "Set 2 — Group B battle",
    hint: "All branches in Group B compete for Spot 2.",
  },
  {
    setKey: "area_final" as const,
    dateKey: "areaFinal" as const,
    hostKey: "hostAreaFinal" as const,
    title: "Area final — Spot 1 vs Spot 2",
    hint: "Group winners battle for the one area representative slot.",
  },
];

interface Props {
  area: string;
  initial: SdAreaScheduleDates;
}

function draftFromInitial(initial: SdAreaScheduleDates): SdAreaScheduleDates {
  return {
    groupA: initial.groupA,
    groupB: initial.groupB,
    areaFinal: initial.areaFinal,
    hostTrainer: initial.hostTrainer ?? "",
    hostGroupA: initial.hostGroupA ?? "",
    hostGroupB: initial.hostGroupB ?? "",
    hostAreaFinal: initial.hostAreaFinal ?? "",
  };
}

function normalizeDates(draft: SdAreaScheduleDates): SdAreaScheduleDates {
  const out: SdAreaScheduleDates = {};
  if (draft.groupA) out.groupA = draft.groupA;
  if (draft.groupB) out.groupB = draft.groupB;
  if (draft.areaFinal) out.areaFinal = draft.areaFinal;
  const hostTrainer = draft.hostTrainer?.trim();
  const hostGroupA = draft.hostGroupA?.trim();
  const hostGroupB = draft.hostGroupB?.trim();
  const hostAreaFinal = draft.hostAreaFinal?.trim();
  if (hostTrainer) out.hostTrainer = hostTrainer;
  if (hostGroupA) out.hostGroupA = hostGroupA;
  if (hostGroupB) out.hostGroupB = hostGroupB;
  if (hostAreaFinal) out.hostAreaFinal = hostAreaFinal;
  return out;
}

export function AreaBattleSchedulesEditor({ area, initial }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => draftFromInitial(initial));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const savedNormalized = useMemo(() => normalizeDates(draftFromInitial(initial)), [initial]);
  const dirty =
    JSON.stringify(normalizeDates(draft)) !== JSON.stringify(savedNormalized);

  async function handleSave() {
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveSdAreaBattleScheduleAction(
        area,
        normalizeDates(draft)
      );
      if (!result.ok) {
        setError(true);
        setMessage(result.error);
        return;
      }
      setMessage(result.message ?? "Battle schedule saved.");
      router.refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sd-neon-panel space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-white">Battle schedule</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Set a different date/time and host for each battle in {area}. Saving
          updates the public leaderboard and syncs the{" "}
          <strong className="text-white">event calendar</strong> automatically.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {BATTLE_FIELDS.map((battle) => (
          <div
            key={battle.setKey}
              className="sd-inset space-y-3 rounded-lg border border-emerald-500/15 p-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-white">{battle.title}</h3>
                <p className="mt-1 text-xs text-sd-muted">{battle.hint}</p>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-sd-muted">
                  Date & time
                </span>
                <input
                  type="datetime-local"
                  value={toDatetimeLocalValue(draft[battle.dateKey])}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      [battle.dateKey]: fromDatetimeLocalValue(e.target.value),
                    }))
                  }
                  className="block w-full rounded-lg sd-input px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-sd-muted">
                  Host / Trainer
                </span>
                <input
                  type="text"
                  value={draft[battle.hostKey] ?? ""}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      [battle.hostKey]: e.target.value,
                    }))
                  }
                  placeholder={
                    draft.hostTrainer?.trim() || "Name shown on public board"
                  }
                  className="block w-full rounded-lg sd-input px-3 py-2 text-sm"
                />
              </label>
            </div>
        ))}
      </div>

      <label className="block max-w-md">
        <span className="mb-1 block text-xs font-medium text-sd-muted">
          Default host / trainer (optional)
        </span>
        <input
          type="text"
          value={draft.hostTrainer ?? ""}
          onChange={(e) =>
            setDraft((s) => ({ ...s, hostTrainer: e.target.value }))
          }
          placeholder="Used when a battle host above is blank"
          className="block w-full rounded-lg sd-input px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => void handleSave()}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save battle schedule"}
        </button>
        <p className="text-xs text-sd-muted">
          Calendar entries: {area} · Set 1, Set 2, and area final
        </p>
      </div>

      {message && (
        <p className={`text-sm ${error ? "text-rose-200" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
    </section>
  );
}
