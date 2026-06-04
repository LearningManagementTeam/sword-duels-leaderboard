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

const LIMIT_OPTIONS = [50, 100, 200] as const;

export function AuditLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action") ?? "";
  const limit = searchParams.get("limit") ?? "100";

  function update(next: { action?: string; limit?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const actionVal = next.action ?? action;
    const limitVal = next.limit ?? limit;
    if (actionVal) params.set("action", actionVal);
    else params.delete("action");
    if (limitVal && limitVal !== "100") params.set("limit", limitVal);
    else params.delete("limit");
    const q = params.toString();
    router.push(q ? `/admin/audit?${q}` : "/admin/audit");
  }

  return (
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
        hint={ADMIN_TOOLS_HINTS.auditFilter}
        className="pb-2 sm:max-w-xs"
      />
    </div>
  );
}
