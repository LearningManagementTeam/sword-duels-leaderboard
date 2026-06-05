import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { BrandingEditor } from "@/components/admin/BrandingEditor";
import { BrandingSectionNav } from "@/components/admin/BrandingSectionNav";
import { getBranding } from "@/lib/data/content-queries";
import { NATIONAL_COMPETITIONS_ADMIN } from "@/lib/admin-routes";

export default async function AdminBrandingPage() {
  const branding = await getBranding();

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: NATIONAL_COMPETITIONS_ADMIN },
          { label: "Branding" },
        ]}
      />
      <div className="sd-page-header">
        <h1>Branding</h1>
        <p>
          Partner logos, home photo carousel (4 slots), and hero logo for public
          leaderboards.
        </p>
      </div>
      <BrandingSectionNav />
      <BrandingEditor initial={branding} />
    </div>
  );
}
