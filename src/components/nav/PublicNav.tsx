"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

type NavId = "home" | "swordDuels" | "rules";

const ITEMS: { id: NavId; label: string; mobileLabel?: string }[] = [
  { id: "home", label: "Home" },
  { id: "swordDuels", label: "Sword Duels", mobileLabel: "Duels" },
  { id: "rules", label: "How to win", mobileLabel: "Rules" },
];

function resolveHref(id: NavId, isPreview: boolean): string {
  if (id === "home") return isPreview ? "/preview" : "/";
  if (id === "swordDuels") return SWORD_DUELS_PUBLIC;
  return "/mechanics";
}

function isActive(pathname: string, id: NavId, isPreview: boolean): boolean {
  if (id === "home") {
    return isPreview ? pathname === "/preview" : pathname === "/";
  }
  if (id === "swordDuels") {
    return (
      pathname.startsWith(SWORD_DUELS_PUBLIC) ||
      pathname.startsWith("/preview/sword-duels")
    );
  }
  return pathname.startsWith("/mechanics");
}

function NavLink({
  id,
  label,
  mobileLabel,
  pathname,
  variant,
  isPreview,
}: {
  id: NavId;
  label: string;
  mobileLabel?: string;
  pathname: string;
  variant: "mobile" | "desktop";
  isPreview: boolean;
}) {
  const active = isActive(pathname, id, isPreview);
  const href = resolveHref(id, isPreview);
  const displayLabel =
    variant === "mobile" && mobileLabel ? mobileLabel : label;

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
    swordDuels: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <path d="m14.5 17.5 3 3M8.5 6.5 5.5 3.5M3 21l7.5-7.5M21 3 12 12M6.5 17.5l-4 4M17.5 6.5l4-4" />
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

export function PublicNav() {
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
              mobileLabel={item.mobileLabel}
              pathname={pathname}
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
              mobileLabel={item.mobileLabel}
              pathname={pathname}
              variant="mobile"
              isPreview={isPreview}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
