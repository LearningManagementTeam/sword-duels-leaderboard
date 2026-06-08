"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InfoTip } from "@/components/admin/InfoTip";
import { HRIS_NAV_HINTS } from "@/lib/admin-action-hints";
import { hrisPath } from "@/lib/admin-routes";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: hrisPath(), label: "Dashboard", exact: true },
  { href: hrisPath("branches"), label: "Branches" },
  { href: hrisPath("employees"), label: "Employee directory" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HrisNav() {
  const pathname = usePathname() ?? hrisPath();

  return (
    <nav aria-label="HRIS sections" className="flex flex-wrap items-center gap-2 text-sm">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href, link.exact);
        const hint = HRIS_NAV_HINTS[link.href];
        return (
          <span key={link.href} className="inline-flex shrink-0 items-center gap-0.5">
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 transition ${
                active
                  ? "bg-gradient-to-r from-violet-400 to-fuchsia-400 font-semibold text-sd-deep shadow-[0_0_12px_rgb(167_139_250/0.35)]"
                  : "sd-glass text-sd-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
            {hint && (
              <InfoTip label={`About ${link.label}`} placement="below">
                {hint}
              </InfoTip>
            )}
          </span>
        );
      })}
    </nav>
  );
}
