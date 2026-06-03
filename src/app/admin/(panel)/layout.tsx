import Link from "next/link";
import { signOut } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/branches", label: "Branches" },
  { href: "/admin/representatives", label: "Representatives" },
  { href: "/admin/rounds", label: "Rounds" },
  { href: "/admin/advancement", label: "Advancement" },
  { href: "/admin/mechanics", label: "Mechanics" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/preview", label: "Preview" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sd-deep text-emerald-50">
      <header className="border-b border-sd-glow/20 bg-sd-panel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="font-semibold text-sd-glow">
            Admin · Sword Duels
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sd-muted hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/system"
              className="text-sm text-sd-muted/80 hover:text-sd-glow"
            >
              System & stack
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
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
