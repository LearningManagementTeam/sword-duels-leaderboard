import Link from "next/link";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { SdAreaGroupModeBadge } from "@/components/sword-duels/SdAreaGroupModeBadge";
import { SdAreaStatusBadge } from "@/components/sword-duels/SdAreaStatusBadge";
import { getSdDashboard, getSdEvent } from "@/lib/products/sword-duels/queries";
import { areaSlug } from "@/lib/products/sword-duels/area-groups";
import { SWORD_DUELS_ADMIN, swordDuelsPath } from "@/lib/admin-routes";
import { REGION_LABELS } from "@/lib/scoring-config";
import type { Region } from "@/lib/scoring-config";

export const dynamic = "force-dynamic";

export default async function SwordDuelsAreasPage() {
  const event = await getSdEvent();
  if (!event) {
    return (
      <p className="text-sd-muted">Sword Duels event not configured.</p>
    );
  }

  const { areas } = await getSdDashboard(event.id);

  const champions = areas.filter((a) => a.finalPublished).length;

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Sword Duels", href: SWORD_DUELS_ADMIN },
          { label: "Areas" },
        ]}
      />
      <div className="sd-page-header">
        <h1>Areas</h1>
        <p>
          Score group battles and area finals per area.
          {areas.length > 0 && (
            <>
              {" "}
              {champions} of {areas.length} area finals published.
            </>
          )}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {areas.map((a) => (
          <Link
            key={a.area}
            href={swordDuelsPath("areas", areaSlug(a.area))}
            className="sd-neon-panel flex items-start justify-between gap-3 p-4 transition hover:ring-1 hover:ring-cyan-400/25"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-white">{a.area}</h2>
                <SdAreaGroupModeBadge isManual={a.isManual} />
              </div>
              <p className="mt-1 text-xs text-sd-muted">
                {REGION_LABELS[a.region as Region]} · Group A ({a.groupACount})
                · Group B ({a.groupBCount})
              </p>
            </div>
            <SdAreaStatusBadge area={a} />
          </Link>
        ))}
      </div>
    </div>
  );
}
