import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  primary: "sd-btn-primary",
  secondary: "sd-btn-secondary",
  ghost: "sd-btn-ghost",
  danger: "sd-btn-danger",
};

export function SdButton({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm transition ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
