"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { InfoTip } from "@/components/admin/InfoTip";
import { ADMIN_NAV_HINTS } from "@/lib/admin-action-hints";
import {
  NATIONAL_COMPETITIONS_ADMIN,
  nationalCompetitionsPath,
} from "@/lib/admin-routes";

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
      {
        href: NATIONAL_COMPETITIONS_ADMIN,
        label: "Dashboard",
        exact: true,
      },
      { href: nationalCompetitionsPath("rounds"), label: "Rounds" },
      { href: nationalCompetitionsPath("advancement"), label: "Advancement" },
    ],
  },
  {
    id: "roster",
    label: "Roster",
    links: [
      {
        href: nationalCompetitionsPath("representatives"),
        label: "Representatives",
      },
    ],
  },
  {
    id: "site",
    label: "Site",
    links: [
      { href: nationalCompetitionsPath("competition"), label: "Competition map" },
      { href: nationalCompetitionsPath("mechanics"), label: "Mechanics" },
      { href: nationalCompetitionsPath("branding"), label: "Branding" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    links: [
      { href: nationalCompetitionsPath("preview"), label: "Preview" },
      { href: nationalCompetitionsPath("audit"), label: "Audit log" },
      { href: nationalCompetitionsPath("export"), label: "Export" },
    ],
  },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavPill({
  link,
  pathname,
  tipPlacement,
}: {
  link: NavLink;
  pathname: string;
  tipPlacement: "right" | "below";
}) {
  const active = isActive(pathname, link.href, link.exact);
  const hint = ADMIN_NAV_HINTS[link.href];

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5">
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={`rounded-lg px-3 py-1.5 transition ${
          active
            ? "bg-gradient-to-r from-sd-lime to-emerald-400 font-semibold text-sd-deep shadow-[0_0_12px_rgb(163_230_53/0.3)]"
            : "sd-glass text-sd-muted hover:text-white"
        }`}
      >
        {link.label}
      </Link>
      {hint && (
        <InfoTip label={`About ${link.label}`} placement={tipPlacement}>
          {hint}
        </InfoTip>
      )}
    </span>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <div className="relative md:hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-sd-panel/95 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-sd-panel/95 to-transparent"
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
                <NavPill
                  key={link.href}
                  link={link}
                  pathname={pathname}
                  tipPlacement="below"
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <div className="hidden flex-col gap-2 md:flex">
      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-wrap items-center gap-2">
          <span className="w-[4.5rem] shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-sd-muted/45">
            {group.label}
          </span>
          {group.links.map((link) => (
            <NavPill
              key={link.href}
              link={link}
              pathname={pathname}
              tipPlacement="below"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname() ?? NATIONAL_COMPETITIONS_ADMIN;

  return (
    <nav aria-label="Admin sections" className="text-sm">
      <p className="mb-2 hidden text-xs text-sd-muted/60 md:block">
        Tap <span className="text-sd-muted">?</span> beside any page for what it
        does and when to use it.
      </p>
      <MobileNav pathname={pathname} />
      <DesktopNav pathname={pathname} />
    </nav>
  );
}
