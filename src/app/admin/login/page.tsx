import { signInWithPassword } from "@/lib/actions/auth";
import Link from "next/link";
import { ArBackdrop } from "@/components/ui/ArBackdrop";
import { getBranding } from "@/lib/data/content-queries";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const branding = await getBranding();
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <ArBackdrop branding={branding} />
      <div className="sd-neon-panel relative w-full max-w-md space-y-6 p-8">
        <div>
          <h1 className="text-xl font-bold text-white">Admin sign in</h1>
          <p className="text-sm text-sd-muted">
            Central team only.{" "}
            <Link href="/" className="text-sd-glow hover:underline">
              Back to leaderboard
            </Link>
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200 ring-1 ring-red-500/30">
            {decodeURIComponent(error)}
          </p>
        )}
        <form action={signInWithPassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-sd-muted">Email</label>
            <input
              name="email"
              type="email"
              required
              className="sd-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-sd-muted">Password</label>
            <input
              name="password"
              type="password"
              required
              className="sd-input w-full px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="sd-btn-primary w-full rounded-lg py-2">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
