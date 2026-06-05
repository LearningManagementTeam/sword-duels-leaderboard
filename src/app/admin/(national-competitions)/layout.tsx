import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { signOut } from "@/lib/actions/admin";
import { requireAdminLayoutAccess } from "@/lib/admin-layout-auth";
import { ADMIN_HUB, NATIONAL_COMPETITIONS_ADMIN } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function NationalCompetitionsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminLayoutAccess();

  return (
    <div className="relative min-h-screen text-emerald-50">
      <ArBackdrop />
      <header className="relative border-b border-transparent bg-sd-panel/75 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-emerald-400/50 via-fuchsia-400/30 to-purple-500/40"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={NATIONAL_COMPETITIONS_ADMIN}
                className="font-semibold text-sd-glow"
              >
                Admin · National Competitions
              </Link>
              <Link
                href={ADMIN_HUB}
                className="rounded-lg bg-sd-panel/80 px-2.5 py-1 text-xs text-sd-muted ring-1 ring-emerald-500/20 hover:text-white"
              >
                Main menu
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`${NATIONAL_COMPETITIONS_ADMIN}/system`}
                className="text-sm text-sd-muted/80 hover:text-sd-glow"
              >
                System & stack
              </Link>
              <Link href="/" className="text-sm text-sd-muted hover:text-white">
                Public site
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-sd-muted hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
