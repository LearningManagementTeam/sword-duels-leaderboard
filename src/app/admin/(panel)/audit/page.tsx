import { getAuditLog } from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AuditPage() {
  const entries = isSupabaseConfigured() ? await getAuditLog(100) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="text-sm text-slate-400">
        Admin actions only — not shown on the public site.
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">Admin</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Entity</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  No entries yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-800">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{e.admin_email}</td>
                  <td className="px-3 py-2">{e.action}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {e.entity_type}
                    {e.entity_id ? ` · ${e.entity_id.slice(0, 8)}…` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
