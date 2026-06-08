import { AdminActionHint } from "@/components/admin/AdminActionHint";
import { SdButtonLink } from "@/components/ui/SdButtonLink";
import { ADMIN_WORKFLOW_HINTS } from "@/lib/admin-action-hints";
import { hrisPath } from "@/lib/admin-routes";

const ctaSize = "px-3 py-1.5 text-sm";

export function HrisWorkflowCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sd-neon-panel flex flex-col p-4 ring-1 ring-violet-400/20">
        <h3 className="font-semibold text-white">Branches</h3>
        <p className="mt-1 flex-1 text-sm text-sd-muted">
          Master list of ~135 branches — codes, areas, regions, and
          active/inactive status. Competitions read this data; edit here first.
        </p>
        <div className="mt-3 space-y-1.5">
          <SdButtonLink href={hrisPath("branches")} className={ctaSize}>
            Manage branches
          </SdButtonLink>
          <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.branches} />
        </div>
      </div>

      <div className="sd-neon-panel flex flex-col p-4 ring-1 ring-violet-400/20">
        <h3 className="font-semibold text-white">Employee directory</h3>
        <p className="mt-1 flex-1 text-sm text-sd-muted">
          Competition rep profiles — employee number, name, position, and
          employment status (active, on leave, resigned).
        </p>
        <div className="mt-3 space-y-1.5">
          <SdButtonLink
            href={hrisPath("employees")}
            variant="ghost"
            className={ctaSize}
          >
            Open employee directory
          </SdButtonLink>
          <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.employeeDirectory} />
        </div>
      </div>
    </div>
  );
}
