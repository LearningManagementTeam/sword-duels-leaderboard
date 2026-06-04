import { ExportStandingsPanel } from "@/components/admin/ExportStandingsPanel";

export default function AdminExportPage() {
  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Export standings</h1>
        <p>Download published CSV files for reporting. Requires admin sign-in.</p>
      </div>
      <ExportStandingsPanel />
    </div>
  );
}
