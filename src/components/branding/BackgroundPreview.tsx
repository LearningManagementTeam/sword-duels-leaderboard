import { resolveBackdropUrl, type BrandingConfig } from "@/lib/branding";

interface Props {
  branding: BrandingConfig;
  label?: string;
}

/** Mini preview of how the blurred page background will look */
export function BackgroundPreview({ branding, label }: Props) {
  const src = resolveBackdropUrl(branding);

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium uppercase tracking-wider text-sd-muted/70">
          {label}
        </p>
      )}
      <div className="relative h-36 overflow-hidden rounded-xl border border-emerald-500/25 sd-inset sm:h-44">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${src})`,
            filter: "blur(20px) brightness(0.65)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgb(4 26 18 / 0.75), rgb(4 26 18 / 0.9))",
          }}
        />
        <p className="relative flex h-full items-center justify-center px-4 text-center text-xs text-sd-muted">
          Blurred backdrop preview — content stays readable on top
        </p>
      </div>
    </div>
  );
}
