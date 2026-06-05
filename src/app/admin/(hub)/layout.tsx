import Link from "next/link";
import { signOut } from "@/lib/actions/admin";
import { requireAdminLayoutAccess } from "@/lib/admin-layout-auth";
import { ArBackdrop } from "@/components/ui/ArBackdrop";

export const dynamic = "force-dynamic";

export default async function AdminHubLayout({
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="font-semibold text-sd-glow">
            Admin · Operations
          </Link>
          <div className="flex items-center gap-3">
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
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
