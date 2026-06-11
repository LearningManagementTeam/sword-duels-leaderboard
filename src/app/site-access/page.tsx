import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { isSiteAccessEnabled } from "@/lib/site-access";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SiteAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  if (!isSiteAccessEnabled()) {
    redirect("/");
  }

  const { returnTo, error } = await searchParams;
  const destination =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo.startsWith("/site-access")
        ? "/"
        : returnTo
      : "/";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <ArBackdrop />
      <div className="sd-neon-panel relative w-full max-w-md space-y-6 p-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sd-glow">
            Internal access
          </p>
          <h1 className="mt-2 text-xl font-bold text-white">Branch manager sign-in</h1>
          <p className="mt-2 text-sm leading-relaxed text-sd-muted">
            Enter the site password shared with branch managers. Do not share this
            password with staff or on public channels.
          </p>
        </div>

        {error === "incorrect" && (
          <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200 ring-1 ring-red-500/30">
            Incorrect password. Try again or contact the central team.
          </p>
        )}

        {error === "rate_limit" && (
          <p className="rounded-lg bg-amber-950/50 px-3 py-2 text-sm text-amber-100 ring-1 ring-amber-500/30">
            Too many attempts from this network. Wait a few minutes, then try
            again.
          </p>
        )}

        <form action="/api/site-access" method="POST" className="space-y-4">
          <input type="hidden" name="returnTo" value={destination} />
          <div>
            <label className="mb-1 block text-sm text-sd-muted">Site password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              className="sd-input w-full px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="sd-btn-primary w-full rounded-lg py-2">
            Continue to leaderboard
          </button>
        </form>

        <p className="text-xs text-sd-muted/80">
          Central team operators: after unlocking, go to{" "}
          <Link href="/admin/login" className="text-sd-glow hover:underline">
            Admin sign in
          </Link>{" "}
          to score rounds or edit HRIS data.
        </p>
      </div>
    </div>
  );
}
