"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toPreviewPath } from "@/lib/public-standings-route";

interface Props {
  standingsHref: string;
  standingsLabel: string;
}

type NavId = "home" | "standings" | "rules";

const ITEMS: { id: NavId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "standings", label: "Standings" },
  { id: "rules", label: "How to win" },
];

function resolveHref(
  id: NavId,
  standingsHref: string,
  isPreview: boolean
): string {
  if (id === "home") return isPreview ? "/preview" : "/";
  if (id === "standings") {
    return isPreview ? toPreviewPath(standingsHref) : standingsHref;
  }
  return "/mechanics";
}

function isActive(pathname: string, id: NavId, isPreview: boolean): boolean {
  if (id === "home") {
    return isPreview ? pathname === "/preview" : pathname === "/";
  }
  if (id === "rules") return pathname.startsWith("/mechanics");
  if (id === "standings") {
    if (isPreview) {
      return (
        /^\/preview\/(june|july)\/(luzon|ncr|vismin)/.test(pathname) ||
        pathname === "/preview/august"
      );
    }
    return (
      /^\/june\/(luzon|ncr|vismin)/.test(pathname) ||
      pathname === "/june/leaderboard" ||
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
  standingsLabel,
  variant,
  isPreview,
}: {
  id: NavId;
  label: string;
  pathname: string;
  standingsHref: string;
  standingsLabel: string;
  variant: "mobile" | "desktop";
  isPreview: boolean;
}) {
  const active = isActive(pathname, id, isPreview);
  const href = resolveHref(id, standingsHref, isPreview);
  const displayLabel =
    id === "standings" && variant === "desktop"
      ? isPreview
        ? `Preview · ${standingsLabel}`
        : standingsLabel
      : id === "standings" && isPreview
        ? "Preview"
        : label;

  const base =
    variant === "mobile"
      ? "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium"
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
      {variant === "mobile" && <NavIcon id={id} active={active} />}
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
    rules: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <path d="M6 4h12a1 1 0 0 1 1 1v14l-4-2-4 2-4-2-4 2V5a1 1 0 0 1 1-1Z" />
      </svg>
    ),
  };
  return icons[id];
}

export function PublicNav({ standingsHref, standingsLabel }: Props) {
  const pathname = usePathname() ?? "/";
  const isPreview = pathname.startsWith("/preview");

  return (
    <>
      {isPreview && (
        <div
          className="fixed inset-x-0 top-0 z-[60] hidden border-b border-amber-500/30 bg-amber-950/90 py-1.5 text-center text-xs text-amber-100 md:block"
          role="status"
        >
          Sample data preview —{" "}
          <Link href="/" className="font-medium underline hover:text-white">
            go to live site
          </Link>
        </div>
      )}
      <nav
        className={`fixed inset-x-0 z-50 hidden border-b border-emerald-500/15 bg-sd-deep/90 backdrop-blur-xl md:block ${
          isPreview ? "top-8" : "top-0"
        }`}
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
              standingsLabel={standingsLabel}
              variant="desktop"
              isPreview={isPreview}
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
              standingsLabel={standingsLabel}
              variant="mobile"
              isPreview={isPreview}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
