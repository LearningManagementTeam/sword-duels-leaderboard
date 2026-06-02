import { ImportBranchesButton } from "@/components/admin/ImportBranchesButton";
import { SetupBanner } from "@/components/SetupBanner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function AdminBranchesPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Branches</h1>
      {!configured && <SetupBanner />}

      <p className="text-sm text-slate-400">
        Import from <code className="text-amber-200">data/branches.csv</code>{" "}
        (142 branches with area and region). Replace that file with your official
        master list, then import again.
      </p>

      <ImportBranchesButton />
    </div>
  );
}
