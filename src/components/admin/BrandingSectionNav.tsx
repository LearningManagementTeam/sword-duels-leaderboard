const SECTIONS = [
  { id: "branding-partner-logos", label: "Partner logos" },
  { id: "branding-carousel", label: "Carousel" },
  { id: "branding-logo", label: "Hero logo" },
] as const;

export function BrandingSectionNav() {
  return (
    <nav
      aria-label="Branding sections"
      className="flex flex-wrap gap-2 text-xs"
    >
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="sd-btn-ghost rounded-lg px-3 py-1.5"
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
