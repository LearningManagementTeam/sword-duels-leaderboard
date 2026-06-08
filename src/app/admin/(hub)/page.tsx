import { AdminHubMenu } from "@/components/admin/AdminHubMenu";
import { SetupBanner } from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminHubPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Admin</h1>
        <p>
          Two systems: <strong className="text-white">HRIS</strong> for branches
          and employee profiles; <strong className="text-white">Revalida</strong>{" "}
          for running competitions and events.
        </p>
      </div>

      {!configured && <SetupBanner />}

      <AdminHubMenu />
    </div>
  );
}
