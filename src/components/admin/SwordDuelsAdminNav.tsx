"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SWORD_DUELS_ADMIN, swordDuelsPath } from "@/lib/admin-routes";

const LINKS = [
  { href: SWORD_DUELS_ADMIN, label: "Dashboard", exact: true },
  { href: swordDuelsPath("areas"), label: "Areas" },
  { href: swordDuelsPath("representatives"), label: "Representatives" },
  { href: swordDuelsPath("brackets"), label: "Brackets" },
  { href: swordDuelsPath("nationals"), label: "Nationals" },
  { href: swordDuelsPath("mechanics"), label: "Mechanics" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SwordDuelsAdminNav() {
  const pathname = usePathname() ?? SWORD_DUELS_ADMIN;

  return (
    <nav aria-label="Sword Duels admin" className="flex flex-wrap gap-2 text-sm">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 transition ${
              active
                ? "bg-gradient-to-r from-cyan-400 to-emerald-400 font-semibold text-sd-deep shadow-[0_0_12px_rgb(34_211_238/0.3)]"
                : "sd-glass text-sd-muted hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
