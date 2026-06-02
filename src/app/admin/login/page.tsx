import { signInWithPassword } from "@/lib/actions/auth";
import Link from "next/link";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-700 bg-slate-900 p-8">
        <div>
          <h1 className="text-xl font-bold text-white">Admin sign in</h1>
          <p className="text-sm text-slate-400">
            Central team only.{" "}
            <Link href="/" className="text-amber-400 hover:underline">
              Back to leaderboard
            </Link>
          </p>
        </div>
        {error && (
          <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {decodeURIComponent(error)}
          </p>
        )}
        <form action={signInWithPassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 py-2 font-medium text-slate-900 hover:bg-amber-400"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
