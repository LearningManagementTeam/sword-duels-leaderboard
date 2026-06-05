import Link from "next/link";
import { ADMIN_HUB } from "@/lib/admin-routes";

interface Props {
  title: string;
  description?: string;
}

export function AdminComingSoon({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <div className="sd-neon-panel space-y-4 p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-sd-muted/70">
          Coming soon
        </p>
        <h1 className="text-2xl font-bold text-sd-glow">{title}</h1>
        <p className="text-sm text-sd-muted">
          {description ??
            "This operations dashboard is not available yet."}
        </p>
        <Link
          href={ADMIN_HUB}
          className="sd-btn-primary inline-flex rounded-lg px-5 py-2.5 text-sm"
        >
          Back to main menu
        </Link>
      </div>
    </div>
  );
}
