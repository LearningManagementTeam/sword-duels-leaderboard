import { BACKGROUND_UPLOAD_SPECS } from "@/lib/branding";

export async function validateBackgroundFile(
  file: File
): Promise<string | null> {
  if (file.size === 0) return "Choose an image file to upload.";
  if (file.size > BACKGROUND_UPLOAD_SPECS.maxBytes) {
    return `Background must be ${BACKGROUND_UPLOAD_SPECS.maxSizeLabel} or smaller.`;
  }
  if (
    !BACKGROUND_UPLOAD_SPECS.mimeTypes.includes(
      file.type as (typeof BACKGROUND_UPLOAD_SPECS.mimeTypes)[number]
    )
  ) {
    return "Use JPG, PNG, or WebP (no SVG for backgrounds).";
  }

  const url = URL.createObjectURL(file);
  try {
    const dims = await loadImageDimensions(url);
    if (dims.width < BACKGROUND_UPLOAD_SPECS.minWidth) {
      return `Image is too small (${dims.width}px wide). Use at least ${BACKGROUND_UPLOAD_SPECS.minWidthLabel}.`;
    }
    if (dims.height < BACKGROUND_UPLOAD_SPECS.minHeight) {
      return `Image is too short (${dims.height}px). Minimum height is ${BACKGROUND_UPLOAD_SPECS.minHeight}px.`;
    }
    const aspect = dims.width / dims.height;
    if (
      aspect < BACKGROUND_UPLOAD_SPECS.minAspect ||
      aspect > BACKGROUND_UPLOAD_SPECS.maxAspect
    ) {
      return `${BACKGROUND_UPLOAD_SPECS.aspectHint}. Your image is ${dims.width}×${dims.height}.`;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImageDimensions(
  src: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image dimensions."));
    img.src = src;
  });
}
