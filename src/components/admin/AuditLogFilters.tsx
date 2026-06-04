"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminActionHint } from "@/components/admin/AdminActionHint";
import { ADMIN_TOOLS_HINTS } from "@/lib/admin-action-hints";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "publish_round", label: "Publish round" },
  { value: "save_round_results", label: "Save round (draft)" },
  { value: "save_competition_map", label: "Competition map" },
  { value: "upload_branding_logo", label: "Branding (logo)" },
  { value: "upload_carousel_slide", label: "Branding (carousel)" },
  { value: "upload_sponsor_logo", label: "Branding (partner logos)" },
  { value: "import_", label: "Imports" },
  { value: "lock_phase", label: "Lock phase" },
  { value: "save_manual_advances", label: "Manual advances" },
  { value: "save_mechanics_content", label: "Mechanics content" },
] as const;

const ENTITY_OPTIONS = [
  { value: "", label: "All entities" },
  { value: "round", label: "Round" },
  { value: "season", label: "Season" },
  { value: "branches", label: "Branches" },
  { value: "june_area", label: "June import" },
  { value: "site_content", label: "Site content" },
  { value: "branding", label: "Branding" },
] as const;

const QUICK_FILTERS: Array<{ label: string; action: string }> = [
  { label: "All", action: "" },
  { label: "Publishes", action: "publish_round" },
  { label: "Imports", action: "import_" },
  { label: "Locks", action: "lock_phase" },
];

const LIMIT_OPTIONS = [50, 100, 200] as const;

export function AuditLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action") ?? "";
  const entity = searchParams.get("entity") ?? "";
  const email = searchParams.get("email") ?? "";
  const limit = searchParams.get("limit") ?? "100";

  function update(next: {
    action?: string;
    entity?: string;
    email?: string;
    limit?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const actionVal = next.action ?? action;
    const entityVal = next.entity ?? entity;
    const emailVal = next.email ?? email;
    const limitVal = next.limit ?? limit;

    if (actionVal) params.set("action", actionVal);
    else params.delete("action");
    if (entityVal) params.set("entity", entityVal);
    else params.delete("entity");
    if (emailVal.trim()) params.set("email", emailVal.trim());
    else params.delete("email");
    if (limitVal && limitVal !== "100") params.set("limit", limitVal);
    else params.delete("limit");

    const q = params.toString();
    router.push(q ? `/admin/audit?${q}` : "/admin/audit");
  }

  function applyQuick(actionFilter: string) {
    const next = new URLSearchParams();
    if (actionFilter) next.set("action", actionFilter);
    if (limit && limit !== "100") next.set("limit", limit);
    const q = next.toString();
    router.push(q ? `/admin/audit?${q}` : "/admin/audit");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((chip) => {
          const active = chip.action === action && !entity && !email;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => applyQuick(chip.action)}
              className={`rounded-lg px-3 py-1 text-xs transition ${
                active
                  ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep"
                  : "sd-glass text-sd-muted hover:text-white"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-sd-muted">
            Action
          </label>
          <select
            value={action}
            onChange={(e) => update({ action: e.target.value })}
            className="sd-input px-3 py-2 text-sm"
          >
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-sd-muted">
            Entity
          </label>
          <select
            value={entity}
            onChange={(e) => update({ entity: e.target.value })}
            className="sd-input px-3 py-2 text-sm"
          >
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value || "all-entity"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-sd-muted">
            Admin email
          </label>
          <input
            type="search"
            value={email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="partial match…"
            className="sd-input min-w-[10rem] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-sd-muted">
            Limit
          </label>
          <select
            value={limit}
            onChange={(e) => update({ limit: e.target.value })}
            className="sd-input px-3 py-2 text-sm"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n} rows
              </option>
            ))}
          </select>
        </div>
        <AdminActionHint
          hint={`${ADMIN_TOOLS_HINTS.auditFilter} ${ADMIN_TOOLS_HINTS.auditEntity} ${ADMIN_TOOLS_HINTS.auditEmail}`}
          className="pb-2 sm:max-w-md"
        />
      </div>
    </div>
  );
}
