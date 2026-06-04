import Link from "next/link";

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

interface Props {
  items: AdminBreadcrumbItem[];
}

export function AdminBreadcrumb({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sd-muted/80">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden className="text-sd-muted/35">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="sd-link hover:no-underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-sd-muted">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
