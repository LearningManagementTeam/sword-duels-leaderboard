"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/branches", label: "Branches" },
  { href: "/admin/representatives", label: "Representatives" },
  { href: "/admin/rounds", label: "Rounds" },
  { href: "/admin/competition", label: "Competition map" },
  { href: "/admin/advancement", label: "Advancement" },
  { href: "/admin/mechanics", label: "Mechanics" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/preview", label: "Preview" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin#export", label: "Export" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (href.includes("#")) {
    return pathname === href.split("#")[0];
  }
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {links.map((l) => {
        const active = isActive(pathname, l.href, l.exact);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 transition ${
              active
                ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep shadow-[0_0_12px_rgb(163_230_53/0.3)]"
                : "sd-glass text-sd-muted hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
