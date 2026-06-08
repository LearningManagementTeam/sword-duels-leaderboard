import Link from "next/link";
import { ADMIN_DOCS, ADMIN_HUB, ADMIN_SYSTEM } from "@/lib/admin-routes";

export function AdminGlobalLinks() {
  return (
    <nav
      aria-label="Admin reference"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
    >
      <Link href={ADMIN_DOCS} className="text-sd-muted hover:text-white">
        Documentation
      </Link>
      <span className="text-sd-muted/30" aria-hidden>
        |
      </span>
      <Link href={ADMIN_SYSTEM} className="text-sd-muted hover:text-white">
        Tech stack
      </Link>
      <span className="text-sd-muted/30" aria-hidden>
        |
      </span>
      <Link href={ADMIN_HUB} className="text-sd-muted hover:text-white">
        Main menu
      </Link>
    </nav>
  );
}
