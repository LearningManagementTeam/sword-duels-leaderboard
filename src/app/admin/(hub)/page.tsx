import { AdminMainMenu } from "@/components/admin/AdminMainMenu";
import { SetupBanner } from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminHubPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div className="sd-page-header">
        <h1>Operations hub</h1>
        <p>
          Choose a program to run. Each product has its own admin dashboard and
          workflows.
        </p>
      </div>

      {!configured && <SetupBanner />}

      <AdminMainMenu />
    </div>
  );
}
