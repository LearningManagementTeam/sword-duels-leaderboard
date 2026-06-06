"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

const LINKS = [
  { href: SWORD_DUELS_PUBLIC, label: "Areas", exact: true },
  { href: `${SWORD_DUELS_PUBLIC}/nationals`, label: "Nationals", exact: false },
  { href: `${SWORD_DUELS_PUBLIC}/mechanics`, label: "How it works", exact: true },
  { href: `${SWORD_DUELS_PUBLIC}/tv`, label: "TV", exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SwordDuelsPublicNav() {
  const pathname = usePathname() ?? SWORD_DUELS_PUBLIC;

  return (
    <nav
      aria-label="Sword Duels"
      className="sd-glass mb-6 flex flex-wrap gap-2 rounded-xl p-2 text-sm"
    >
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 transition ${
              active
                ? "bg-gradient-to-r from-emerald-400 to-lime-400 font-semibold text-sd-deep shadow-[0_0_12px_rgb(74_222_128/0.25)]"
                : "text-sd-muted hover:bg-emerald-500/10 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
