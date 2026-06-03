import { SdDataTable } from "@/components/ui/SdDataTable";
import { getAuditLog } from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AuditPage() {
  const entries = isSupabaseConfigured() ? await getAuditLog(100) : [];

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Audit log</h1>
        <p>Admin actions only — not shown on the public site.</p>
      </div>

      <SdDataTable>
        <thead>
          <tr>
            <th>When</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-sd-muted/60">
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
              </tr>
            ))
          )}
        </tbody>
      </SdDataTable>
    </div>
  );
}
