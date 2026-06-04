import { AdminCallout } from "@/components/admin/AdminCallout";
import { InfoTip } from "@/components/admin/InfoTip";
import { MechanicsEditor } from "@/components/admin/MechanicsEditor";
import { getMechanicsContent } from "@/lib/data/content-queries";
import { ADMIN_NAV_HINTS } from "@/lib/admin-action-hints";

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
          <InfoTip label="About mechanics editor">
            {ADMIN_NAV_HINTS["/admin/mechanics"]}
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
