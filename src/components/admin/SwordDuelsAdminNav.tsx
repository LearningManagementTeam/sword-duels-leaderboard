"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { SWORD_DUELS_ADMIN, swordDuelsPath } from "@/lib/admin-routes";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  links: NavLink[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "operate",
    label: "Operate",
    links: [
      { href: SWORD_DUELS_ADMIN, label: "Dashboard", exact: true },
      { href: swordDuelsPath("areas"), label: "Areas" },
      { href: swordDuelsPath("nationals"), label: "Nationals" },
    ],
  },
  {
    id: "roster",
    label: "Roster",
    links: [
      { href: swordDuelsPath("representatives"), label: "Representatives" },
      { href: swordDuelsPath("brackets"), label: "Brackets" },
    ],
  },
  {
    id: "site",
    label: "Site",
    links: [{ href: swordDuelsPath("mechanics"), label: "Mechanics" }],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavPill({
  link,
  pathname,
}: {
  link: NavLink;
  pathname: string;
}) {
  const active = isActive(pathname, link.href, link.exact);
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-lg px-3 py-1.5 transition ${
        active
          ? "bg-gradient-to-r from-cyan-400 to-emerald-400 font-semibold text-sd-deep shadow-[0_0_12px_rgb(34_211_238/0.3)]"
          : "sd-glass text-sd-muted hover:text-white"
      }`}
    >
      {link.label}
    </Link>
  );
}

export function SwordDuelsAdminNav() {
  const pathname = usePathname() ?? SWORD_DUELS_ADMIN;

  return (
    <nav aria-label="Sword Duels admin" className="text-sm">
      <div className="relative md:hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-sd-panel/95 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-sd-panel/95 to-transparent"
          aria-hidden
        />
        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-2 px-1">
            {NAV_GROUPS.map((group, groupIndex) => (
              <Fragment key={group.id}>
                {groupIndex > 0 && (
                  <span
                    className="mx-0.5 h-5 w-px shrink-0 bg-emerald-500/25"
                    aria-hidden
                  />
                )}
                <span className="sr-only">{group.label}</span>
                {group.links.map((link) => (
                  <NavPill key={link.href} link={link} pathname={pathname} />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden flex-col gap-2 md:flex">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="flex flex-wrap items-center gap-2">
            <span className="w-[4.5rem] shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-sd-muted/45">
              {group.label}
            </span>
            {group.links.map((link) => (
              <NavPill key={link.href} link={link} pathname={pathname} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
