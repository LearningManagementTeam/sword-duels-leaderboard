import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group">
          <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-amber-300">
            Sword Duels
          </h1>
          <p className="text-xs text-slate-400">Dynamic Leaderboard</p>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/tv"
            className="text-slate-400 hover:text-white"
            title="TV / fullscreen mode"
          >
            TV mode
          </Link>
          <Link
            href="/admin"
            className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
