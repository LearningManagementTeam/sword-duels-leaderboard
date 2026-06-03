"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  standingsHref: string;
  phaseHref: string;
  standingsLabel: string;
}

type NavId = "home" | "standings" | "phases" | "rules";

const ITEMS: { id: NavId; label: string; hrefKey?: NavId }[] = [
  { id: "home", label: "Home" },
  { id: "standings", label: "Standings" },
  { id: "phases", label: "Phases" },
  { id: "rules", label: "Rules" },
];

function resolveHref(
  id: NavId,
  standingsHref: string,
  phaseHref: string
): string {
  if (id === "home") return "/";
  if (id === "standings") return standingsHref;
  if (id === "phases") return phaseHref;
  return "/mechanics";
}

function isActive(pathname: string, id: NavId): boolean {
  if (id === "home") return pathname === "/";
  if (id === "rules") return pathname.startsWith("/mechanics");
  if (id === "phases") {
    return (
      pathname === "/june" ||
      pathname === "/july" ||
      pathname === "/august"
    );
  }
  if (id === "standings") {
    return (
      /^\/june\/(luzon|ncr|vismin)/.test(pathname) ||
      /^\/july\/(luzon|ncr|vismin)/.test(pathname) ||
      pathname === "/august" ||
      pathname.startsWith("/august?")
    );
  }
  return false;
}

function NavLink({
  id,
  label,
  pathname,
  standingsHref,
  phaseHref,
  standingsLabel,
  variant,
}: {
  id: NavId;
  label: string;
  pathname: string;
  standingsHref: string;
  phaseHref: string;
  standingsLabel: string;
  variant: "mobile" | "desktop";
}) {
  const active = isActive(pathname, id);
  const href = resolveHref(id, standingsHref, phaseHref);
  const displayLabel =
    id === "standings" && variant === "desktop" ? standingsLabel : label;

  const base =
    variant === "mobile"
      ? "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium"
      : "rounded-xl px-4 py-2 text-sm font-medium transition";

  const activeClass =
    variant === "mobile"
      ? "text-sd-glow"
      : "bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep shadow-[0_0_16px_rgb(163_230_53/0.25)]";

  const idleClass =
    variant === "mobile"
      ? "text-sd-muted/80 hover:text-white"
      : "sd-glass text-sd-muted hover:border-sd-glow/30 hover:text-white";

  return (
    <Link
      href={href}
      className={`${base} ${active ? activeClass : idleClass}`}
      aria-current={active ? "page" : undefined}
    >
      {variant === "mobile" && (
        <NavIcon id={id} active={active} />
      )}
      <span className={variant === "mobile" ? "leading-none" : undefined}>
        {displayLabel}
      </span>
    </Link>
  );
}

function NavIcon({ id, active }: { id: NavId; active: boolean }) {
  const stroke = active ? "currentColor" : "currentColor";
  const icons: Record<NavId, ReactNode> = {
    home: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    ),
    standings: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <path d="M4 20V10M12 20V4M20 20v-6" />
      </svg>
    ),
    phases: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <circle cx="6" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
        <path d="M8 12h2M14 12h2" />
      </svg>
    ),
    rules: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <path d="M6 4h12a1 1 0 0 1 1 1v14l-4-2-4 2-4-2-4 2V5a1 1 0 0 1 1-1Z" />
      </svg>
    ),
  };
  return icons[id];
}

export function PublicNav({
  standingsHref,
  phaseHref,
  standingsLabel,
}: Props) {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <nav
        className="fixed inset-x-0 top-0 z-50 hidden border-b border-emerald-500/15 bg-sd-deep/90 backdrop-blur-xl md:block"
        aria-label="Site navigation"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-3">
          {ITEMS.map((item) => (
            <NavLink
              key={item.id}
              id={item.id}
              label={item.label}
              pathname={pathname}
              standingsHref={standingsHref}
              phaseHref={phaseHref}
              standingsLabel={standingsLabel}
              variant="desktop"
            />
          ))}
        </div>
      </nav>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-500/20 bg-sd-deep/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Site navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {ITEMS.map((item) => (
            <NavLink
              key={item.id}
              id={item.id}
              label={item.label}
              pathname={pathname}
              standingsHref={standingsHref}
              phaseHref={phaseHref}
              standingsLabel={standingsLabel}
              variant="mobile"
            />
          ))}
        </div>
      </nav>
    </>
  );
}
