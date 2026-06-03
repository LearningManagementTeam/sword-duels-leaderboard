import Link from "next/link";

export function PreviewBanner() {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
    >
      <p className="font-medium text-amber-200">
        Preview — sample data only, not official standings
      </p>
      <p className="mt-1 text-amber-100/80">
        These scores are for demonstration. Live results appear on{" "}
        <Link href="/june" className="underline hover:text-white">
          the official leaderboard
        </Link>
        .
      </p>
    </div>
  );
}
