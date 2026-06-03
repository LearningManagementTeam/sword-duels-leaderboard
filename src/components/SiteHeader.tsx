import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-amber-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-xl ring-1 ring-amber-500/30"
            aria-hidden
          >
            ⚔️
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-amber-300">
              Sword Duels
            </h1>
            <p className="text-xs text-amber-200/70">Dynamic Leaderboard · 2026</p>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/preview"
            className="text-slate-400 hover:text-amber-200"
            title="Sample leaderboards for demos"
          >
            Preview
          </Link>
          <Link
            href="/tv"
            className="text-slate-400 hover:text-white"
            title="TV / fullscreen mode"
          >
            TV mode
          </Link>
          <Link
            href="/admin"
            className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
