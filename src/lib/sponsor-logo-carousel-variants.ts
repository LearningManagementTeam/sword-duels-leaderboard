export const SPONSOR_LOGO_SLOT_W = "w-[140px] sm:w-[160px]";
export const SPONSOR_LOGO_SLOT_H = "h-10 sm:h-10";

export const SPONSOR_LOGO_IMG_CLASS =
  "max-h-full max-w-full object-contain object-center opacity-90";

export const SPONSOR_LOGO_STRIP_CLASS = "relative overflow-hidden";

export const SPONSOR_LOGO_FRAME_H = "h-11 sm:h-12";

/** Seconds for one full marquee loop (scales slightly with logo count). */
export function sponsorMarqueeDurationSec(logoCount: number): number {
  return Math.max(18, logoCount * 10);
}
