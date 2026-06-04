import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { BrandingEditor } from "@/components/admin/BrandingEditor";
import { BrandingSectionNav } from "@/components/admin/BrandingSectionNav";
import { getBranding } from "@/lib/data/content-queries";

export default async function AdminBrandingPage() {
  const branding = await getBranding();

  return (
    <div className="space-y-6">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
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
