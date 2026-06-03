import Link from "next/link";
import { PartnerLogoAnimationShowcase } from "@/components/home/PartnerLogoAnimationShowcase";
import { getActiveSponsorLogos } from "@/lib/branding";
import { getBranding } from "@/lib/data/content-queries";

export const revalidate = 30;

export default async function PartnerLogoAnimationsPreviewPage() {
  const branding = await getBranding();
  const logos = getActiveSponsorLogos(branding);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <header className="sd-page-header space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/90">
          Temporary preview
        </p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Partner logo animations
        </h1>
        <p className="text-sm leading-relaxed text-sd-muted">
          Compare styles using your uploaded partner logos ({logos.length} of 3).
          Production home uses <strong className="text-emerald-100">Slide</strong>{" "}
          today. Hover any animated strip to pause.
        </p>
        <Link href="/" className="sd-link text-sm">
          ← Back to home
        </Link>
      </header>

      {logos.length === 0 ? (
        <div className="sd-neon-panel space-y-3 p-6 text-center">
          <p className="text-sm text-sd-muted">
            Upload partner logos in Admin → Branding first, then reload this page.
          </p>
          <Link href="/admin/branding" className="sd-link text-sm">
            Open Branding →
          </Link>
        </div>
      ) : (
        <PartnerLogoAnimationShowcase logos={logos} />
      )}
    </div>
  );
}
