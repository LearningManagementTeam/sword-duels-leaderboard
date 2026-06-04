import { InfoTip } from "@/components/admin/InfoTip";
import { ADMIN_SITE_HINTS } from "@/lib/admin-action-hints";

const SECTIONS = [
  {
    id: "branding-partner-logos",
    label: "Partner logos",
    hint: ADMIN_SITE_HINTS.brandingSectionPartner,
  },
  {
    id: "branding-carousel",
    label: "Carousel",
    hint: ADMIN_SITE_HINTS.brandingSectionCarousel,
  },
  {
    id: "branding-logo",
    label: "Hero logo",
    hint: ADMIN_SITE_HINTS.brandingSectionLogo,
  },
] as const;

export function BrandingSectionNav() {
  return (
    <nav
      aria-label="Branding sections"
      className="flex flex-wrap items-center gap-2 text-xs"
    >
      {SECTIONS.map((section) => (
        <span key={section.id} className="inline-flex items-center gap-0.5">
          <a
            href={`#${section.id}`}
            className="sd-btn-ghost rounded-lg px-3 py-1.5"
          >
            {section.label}
          </a>
          <InfoTip label={`About ${section.label}`} placement="below">
            {section.hint}
          </InfoTip>
        </span>
      ))}
    </nav>
  );
}
