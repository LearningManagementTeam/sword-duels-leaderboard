import { AdminActionHint } from "@/components/admin/AdminActionHint";
import { SdButtonLink } from "@/components/ui/SdButtonLink";
import { ADMIN_WORKFLOW_HINTS } from "@/lib/admin-action-hints";
import { HRIS_ADMIN, nationalCompetitionsPath } from "@/lib/admin-routes";

const ctaSize = "px-3 py-1.5 text-sm";

export function AdminRosterCards() {
  return (
    <section className="space-y-3" aria-labelledby="roster-setup-heading">
      <div>
        <h2 id="roster-setup-heading" className="text-lg font-semibold text-white">
          Competition roster
        </h2>
        <p className="mt-1 text-sm text-sd-muted">
          Assign who competes as Rep 1 or Rep 2 per branch. Branch and employee
          master data is managed in HRIS.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sd-neon-panel flex flex-col p-4">
          <h3 className="font-semibold text-white">Branch representatives</h3>
          <p className="mt-1 flex-1 text-sm text-sd-muted">
            Assign Rep 1 and Rep 2 per branch for NC and Sword Duels. Saving here
            also updates employee profiles in HRIS.
          </p>
          <div className="mt-3 space-y-1.5">
            <SdButtonLink
              href={nationalCompetitionsPath("representatives")}
              className={ctaSize}
            >
              Edit representatives
            </SdButtonLink>
            <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.representatives} />
          </div>
        </div>

        <div className="sd-neon-panel flex flex-col p-4">
          <h3 className="font-semibold text-white">HRIS — branches & employees</h3>
          <p className="mt-1 flex-1 text-sm text-sd-muted">
            Add branches, import CSV, edit employee numbers, and set employment
            status before or during the season.
          </p>
          <div className="mt-3 space-y-1.5">
            <SdButtonLink href={HRIS_ADMIN} variant="ghost" className={ctaSize}>
              Open HRIS
            </SdButtonLink>
            <AdminActionHint hint={ADMIN_WORKFLOW_HINTS.hrisSetup} />
          </div>
        </div>
      </div>
    </section>
  );
}
