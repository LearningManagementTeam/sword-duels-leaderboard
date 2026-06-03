import { BrandingEditor } from "@/components/admin/BrandingEditor";
import { getBranding } from "@/lib/data/content-queries";

export default async function AdminBrandingPage() {
  const branding = await getBranding();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Branding</h1>
        <p className="mt-1 text-sm text-sd-muted">
          Upload the Sword Duels logo for the site header and public leaderboard
          banner.
        </p>
      </div>
      <BrandingEditor initial={branding} />
    </div>
  );
}
