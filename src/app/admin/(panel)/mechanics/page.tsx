import { AdminCallout } from "@/components/admin/AdminCallout";
import { InfoTip } from "@/components/admin/InfoTip";
import { MechanicsEditor } from "@/components/admin/MechanicsEditor";
import { getMechanicsContent } from "@/lib/data/content-queries";

export default async function AdminMechanicsPage() {
  const content = await getMechanicsContent();

  return (
    <div className="space-y-6">
      <div className="sd-page-header">
        <h1>Public mechanics page</h1>
        <p>
          Edits appear on{" "}
          <a href="/mechanics" className="sd-link">
            /mechanics
          </a>
          . Phase tables and caps are auto-generated from scoring rules.{" "}
          <InfoTip>
            Change intro, announcements, or custom sections here. Survivor
            counts and tie-breakers always match the live scoring engine.
          </InfoTip>
        </p>
      </div>
      <AdminCallout>
        To change cut numbers (32/16/8) or point caps, update scoring config in
        code — not this editor. See Admin → System & stack for technical docs.
      </AdminCallout>
      <MechanicsEditor initial={content} />
    </div>
  );
}
