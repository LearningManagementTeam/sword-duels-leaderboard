"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminActionRow } from "@/components/admin/AdminActionHint";
import { AdminConfirmPanel } from "@/components/admin/AdminConfirmPanel";
import {
  createBranchRecord,
  saveBranchRosterUpdates,
  setBranchActive,
  type BranchRosterUpdate,
} from "@/lib/actions/admin";
import { ADMIN_ROSTER_HINTS } from "@/lib/admin-action-hints";
import { normalizeBranchCode } from "@/lib/branch-roster";
import { REGIONS, REGION_LABELS, type Region } from "@/lib/scoring-config";
import type { Branch } from "@/lib/types";

type RowState = BranchRosterUpdate & {
  is_active: boolean;
};

interface Props {
  branches: Branch[];
  activeCount: number;
  inactiveCount: number;
}

const EMPTY_NEW: BranchRosterUpdate = {
  id: "",
  branch_code: "",
  branch_name: "",
  area: "",
  region: "luzon",
};

function branchToRow(b: Branch): RowState {
  return {
    id: b.id,
    branch_code: b.branch_code,
    branch_name: b.branch_name,
    area: b.area,
    region: b.region,
    is_active: b.is_active !== false,
  };
}

function rowSnapshot(row: RowState): string {
  return [
    normalizeBranchCode(row.branch_code),
    row.branch_name.trim(),
    row.area.trim(),
    row.region,
    row.is_active ? "1" : "0",
  ].join("|");
}

export function BranchesRosterEditor({
  branches,
  activeCount,
  inactiveCount,
}: Props) {
  const router = useRouter();
  const initialRows = useMemo(() => branches.map(branchToRow), [branches]);
  const [rows, setRows] = useState<RowState[]>(initialRows);
  const [baseline, setBaseline] = useState<RowState[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
    setBaseline(initialRows);
  }, [initialRows]);

  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBranch, setNewBranch] = useState({ ...EMPTY_NEW });
  const [pendingDeactivate, setPendingDeactivate] = useState<RowState | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const areas = useMemo(
    () => [...new Set(rows.map((r) => r.area))].sort(),
    [rows]
  );

  const baselineById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of baseline) {
      map.set(row.id, rowSnapshot(row));
    }
    return map;
  }, [baseline]);

  const dirtyRows = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.is_active && rowSnapshot(r) !== baselineById.get(r.id)
      ),
    [rows, baselineById]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;
      if (areaFilter && r.area !== areaFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.branch_name.toLowerCase().includes(q) ||
        r.branch_code.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q)
      );
    });
  }, [rows, search, areaFilter, statusFilter]);

  async function handleSaveChanges() {
    if (dirtyRows.length === 0) {
      setMessage("No changes to save.");
      setError(false);
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveBranchRosterUpdates(
        dirtyRows.map(({ id, branch_code, branch_name, area, region }) => ({
          id,
          branch_code,
          branch_name,
          area,
          region,
        }))
      );
      if (result.ok) {
        setBaseline([...rows]);
        setMessage(
          `Saved ${result.count} branch${result.count === 1 ? "" : "es"}.`
        );
      } else {
        setError(true);
        setMessage(result.errors.join(" "));
      }
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await createBranchRecord({
        branch_code: newBranch.branch_code,
        branch_name: newBranch.branch_name,
        area: newBranch.area,
        region: newBranch.region,
      });
      if (result.ok) {
        setMessage(
          `Added branch ${normalizeBranchCode(newBranch.branch_code)}.`
        );
        setNewBranch({ ...EMPTY_NEW });
        setShowAddForm(false);
        router.refresh();
      } else {
        setError(true);
        setMessage(result.errors.join(" "));
      }
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Create failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(branchId: string, is_active: boolean) {
    setLoading(true);
    setMessage("");
    setError(false);
    try {
      const result = await setBranchActive(branchId, is_active);
      if (result.ok) {
        setRows((prev) =>
          prev.map((r) => (r.id === branchId ? { ...r, is_active } : r))
        );
        setBaseline((prev) =>
          prev.map((r) => (r.id === branchId ? { ...r, is_active } : r))
        );
        setMessage(is_active ? "Branch reactivated." : "Branch deactivated.");
        setPendingDeactivate(null);
        router.refresh();
      } else {
        setError(true);
        setMessage(result.errors.join(" "));
      }
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(id: string, patch: Partial<RowState>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  return (
    <section className="sd-neon-panel space-y-5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Branch roster</h2>
        <p className="mt-1 text-sm text-sd-muted">
          Add a branch, fix a typo, or deactivate one that closed. Deactivated
          branches stay in past scores but drop out of CSV counts and Sword
          Duels bracket sync. For bulk setup, use the CSV import below.
        </p>
      </div>

      <div className="sd-alert-info text-sm">
        <span className="font-medium text-emerald-300">{activeCount}</span> active
        {inactiveCount > 0 && (
          <>
            {" "}
            · <span className="text-sd-muted">{inactiveCount}</span> deactivated
          </>
        )}
        {dirtyRows.length > 0 && (
          <span className="text-amber-200/90">
            {" "}
            · {dirtyRows.length} unsaved edit
            {dirtyRows.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search code, name, or area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg sd-input px-3 py-2 text-sm"
        />
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="rounded-lg sd-input px-3 py-2 text-sm"
        >
          <option value="">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="rounded-lg sd-input px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Deactivated only</option>
        </select>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
        >
          {showAddForm ? "Cancel add" : "Add branch"}
        </button>
      </div>

      {showAddForm && (
        <div className="sd-inset grid gap-3 rounded-lg p-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-sd-muted">Branch code</span>
            <input
              value={newBranch.branch_code}
              onChange={(e) =>
                setNewBranch((b) => ({ ...b, branch_code: e.target.value }))
              }
              placeholder="e.g. MNL-01"
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm uppercase"
            />
          </label>
          <label className="block text-sm">
            <span className="text-sd-muted">Branch name</span>
            <input
              value={newBranch.branch_name}
              onChange={(e) =>
                setNewBranch((b) => ({ ...b, branch_name: e.target.value }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-sd-muted">Area</span>
            <input
              value={newBranch.area}
              onChange={(e) =>
                setNewBranch((b) => ({ ...b, area: e.target.value }))
              }
              placeholder="e.g. Area 1"
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-sd-muted">Region</span>
            <select
              value={newBranch.region}
              onChange={(e) =>
                setNewBranch((b) => ({
                  ...b,
                  region: e.target.value as Region,
                }))
              }
              className="mt-1 block w-full rounded sd-input px-3 py-2 text-sm"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <AdminActionRow hint={ADMIN_ROSTER_HINTS.createBranch}>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleCreate()}
                className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                {loading ? "Saving…" : "Create branch"}
              </button>
            </AdminActionRow>
          </div>
        </div>
      )}

      {pendingDeactivate && (
        <AdminConfirmPanel
          title={`Deactivate ${pendingDeactivate.branch_name}?`}
          tone="danger"
          confirmLabel="Deactivate branch"
          busy={loading}
          onConfirm={() =>
            void handleSetActive(pendingDeactivate.id, false)
          }
          onCancel={() => setPendingDeactivate(null)}
        >
          <p>
            This hides the branch from imports and Sword Duels bracket sync.
            Published scores and standings are kept. You can reactivate later
            from this table.
          </p>
        </AdminConfirmPanel>
      )}

      {branches.length === 0 ? (
        <p className="text-sm text-sd-muted">
          No branches yet — use CSV import below, or add one with{" "}
          <strong className="text-white">Add branch</strong>.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-sd-muted">No branches match your filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 text-xs uppercase tracking-wide text-sd-muted">
                <th className="px-2 py-2">Code</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Area</th>
                <th className="px-2 py-2">Region</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-emerald-500/10 align-top ${
                    !row.is_active ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-2 py-2">
                    <input
                      value={row.branch_code}
                      disabled={!row.is_active}
                      onChange={(e) =>
                        updateRow(row.id, { branch_code: e.target.value })
                      }
                      className="w-full min-w-[5rem] rounded sd-input px-2 py-1 text-xs uppercase"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.branch_name}
                      disabled={!row.is_active}
                      onChange={(e) =>
                        updateRow(row.id, { branch_name: e.target.value })
                      }
                      className="w-full min-w-[8rem] rounded sd-input px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.area}
                      disabled={!row.is_active}
                      onChange={(e) =>
                        updateRow(row.id, { area: e.target.value })
                      }
                      className="w-full min-w-[5rem] rounded sd-input px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={row.region}
                      disabled={!row.is_active}
                      onChange={(e) =>
                        updateRow(row.id, {
                          region: e.target.value as Region,
                        })
                      }
                      className="w-full rounded sd-input px-2 py-1 text-xs"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {REGION_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    {row.is_active ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 ring-1 ring-emerald-400/25 ring-inset">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-sd-muted/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sd-muted ring-1 ring-sd-muted/25 ring-inset">
                        Off
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {row.is_active ? (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setPendingDeactivate(row)}
                        className="text-xs text-red-300/90 hover:text-red-200"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleSetActive(row.id, true)}
                        className="text-xs text-emerald-300/90 hover:text-emerald-200"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <AdminActionRow hint={ADMIN_ROSTER_HINTS.saveBranchRoster}>
          <button
            type="button"
            disabled={loading || dirtyRows.length === 0}
            onClick={() => void handleSaveChanges()}
            className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </AdminActionRow>
        <Link
          href="/admin/national-competitions/representatives"
          className="text-sm text-sd-glow/90 hover:text-sd-glow"
        >
          Edit representatives →
        </Link>
      </div>

      {message && (
        <p
          className={`text-sm ${error ? "text-amber-200" : "text-emerald-300"}`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
