import Link from "next/link";

export function PreviewBanner() {
  return (
    <div role="status" className="sd-alert-warning">
      <p className="font-medium">Preview — sample data only, not official standings</p>
      <p className="mt-1 opacity-90">
        These scores are for demonstration. Live results appear on{" "}
        <Link href="/june/luzon" className="sd-link underline">
          the official leaderboard
        </Link>
        .
      </p>
    </div>
  );
}
