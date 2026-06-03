import { Suspense } from "react";
import { AuditLogFilters } from "@/components/admin/AuditLogFilters";
import { SdDataTable } from "@/components/ui/SdDataTable";
import { getAuditLog } from "@/lib/data/queries";
import { formatAuditDetails } from "@/lib/format-audit-details";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; limit?: string }>;
}) {
  const { action, limit: limitParam } = await searchParams;
  const limit = Math.min(
    Math.max(parseInt(limitParam ?? "100", 10) || 100, 1),
    200
  );
  const actionPrefix = action?.trim() || undefined;
  const entries = isSupabaseConfigured()
    ? await getAuditLog(limit, actionPrefix)
    : [];

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Audit log</h1>
        <p>Admin actions only — not shown on the public site.</p>
      </div>

      <Suspense fallback={null}>
        <AuditLogFilters />
      </Suspense>

      <SdDataTable>
        <thead>
          <tr>
            <th>When</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-sd-muted/60">
                No entries yet.
              </td>
            </tr>
          ) : (
            entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap text-sd-muted/80">
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td>{e.admin_email}</td>
                <td>{e.action}</td>
                <td className="text-sd-muted/80">
                  {e.entity_type}
                  {e.entity_id ? ` · ${e.entity_id.slice(0, 8)}…` : ""}
                </td>
                <td className="max-w-xs text-xs text-sd-muted/70">
                  {formatAuditDetails(e)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </SdDataTable>
    </div>
  );
}
