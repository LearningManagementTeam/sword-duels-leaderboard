import Image from "next/image";

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface Props {
  name: string;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  wildcard?: boolean;
  champion?: boolean;
  muted?: boolean;
}

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function RepAvatar({
  name,
  photoUrl,
  size = "sm",
  className = "",
  wildcard = false,
  champion = false,
  muted = false,
}: Props) {
  const sizeClass = SIZE_CLASS[size];
  const shell = wildcard
    ? "bg-fuchsia-950/50 text-fuchsia-100 ring-fuchsia-400/30"
    : champion
      ? "bg-sd-deep/20 text-sd-deep ring-lime-300/50"
      : muted
        ? "bg-zinc-800/60 text-zinc-500 ring-zinc-700/40"
        : "bg-emerald-950/50 text-emerald-200/90 ring-emerald-500/25";

  if (photoUrl) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded ring-1 ring-inset ${sizeClass} ${shell} ${className}`}
      >
        <Image
          src={photoUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
          sizes={size === "lg" ? "40px" : size === "md" ? "32px" : "28px"}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded font-bold ring-1 ring-inset ${sizeClass} ${shell} ${className}`}
    >
      {initialsFromName(name || "?")}
    </span>
  );
}
