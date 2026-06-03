import Image, { type ImageProps } from "next/image";
import { shouldUnoptimizeBrandingUrl } from "@/lib/branding-storage";

type Props = Omit<ImageProps, "unoptimized"> & {
  src: string;
};

/**
 * Logo and other branding images. Uses unoptimized for /api/branding/storage/*
 * (served by our API; avoids Next 16 localPatterns + build-time optimizer fetch).
 */
export function BrandingImage({ src, alt, ...props }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={shouldUnoptimizeBrandingUrl(src)}
      {...props}
    />
  );
}
