import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "fuchsia";

const variantClass: Record<Variant, string> = {
  primary: "sd-btn-primary",
  secondary: "sd-btn-secondary",
  ghost: "sd-btn-ghost",
  danger: "sd-btn-danger",
  fuchsia:
    "border border-fuchsia-400/40 bg-transparent font-semibold text-fuchsia-200 hover:bg-fuchsia-950/30",
};

interface Props extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

/** Link styled like {@link SdButton} — use for admin navigation CTAs. */
export function SdButtonLink({
  variant = "primary",
  children,
  className = "",
  ...rest
}: Props) {
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm transition ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
