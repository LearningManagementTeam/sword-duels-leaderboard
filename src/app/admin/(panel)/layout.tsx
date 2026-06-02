import Link from "next/link";
import { signOut } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/branches", label: "Branches" },
  { href: "/admin/representatives", label: "Representatives" },
  { href: "/admin/rounds", label: "Rounds" },
  { href: "/admin/advancement", label: "Advancement" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link href="/admin" className="font-semibold text-amber-300">
            Admin · Sword Duels
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-slate-300 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-slate-400 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
