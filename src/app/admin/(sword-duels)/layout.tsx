import Link from "next/link";
import { SwordDuelsAdminNav } from "@/components/admin/SwordDuelsAdminNav";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { signOut } from "@/lib/actions/admin";
import { requireAdminLayoutAccess } from "@/lib/admin-layout-auth";
import { ADMIN_HUB, SWORD_DUELS_ADMIN, SWORD_DUELS_PUBLIC } from "@/lib/admin-routes";

export const dynamic = "force-dynamic";

export default async function SwordDuelsAdminLayout({
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
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-400/50 via-emerald-400/30 to-amber-400/40"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={SWORD_DUELS_ADMIN}
                className="font-semibold text-cyan-200"
              >
                Admin · Sword Duels
              </Link>
              <Link
                href={ADMIN_HUB}
                className="rounded-lg bg-sd-panel/80 px-2.5 py-1 text-xs text-sd-muted ring-1 ring-cyan-500/20 hover:text-white"
              >
                Main menu
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={SWORD_DUELS_PUBLIC}
                className="text-sm text-sd-muted/80 hover:text-cyan-200"
              >
                Public board
              </Link>
              <Link href="/" className="text-sm text-sd-muted hover:text-white">
                Site home
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
          <SwordDuelsAdminNav />
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
