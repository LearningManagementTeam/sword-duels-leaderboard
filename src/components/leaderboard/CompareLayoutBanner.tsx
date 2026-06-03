import Link from "next/link";

interface Props {
  layoutName: string;
  layoutSlug: string;
}

export function CompareLayoutBanner({ layoutName, layoutSlug }: Props) {
  return (
    <div className="sd-alert-info flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <strong>Layout preview:</strong> {layoutName}
        {layoutSlug !== "picker" && (
          <span className="text-sd-muted/80">
            {" "}
            — sample standings after Round 3 so you can see the full layout. Pick
            the view that feels best on your phone and desktop.
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        {layoutSlug !== "picker" && (
          <Link href="/compare/leaderboard" className="sd-link">
            Try other layouts
          </Link>
        )}
        <Link href="/" className="sd-link">
          Back home
        </Link>
      </div>
    </div>
  );
}
