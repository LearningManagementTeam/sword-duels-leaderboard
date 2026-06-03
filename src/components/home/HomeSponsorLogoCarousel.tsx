"use client";

import { useEffect, useState } from "react";
import {
  SPONSOR_LOGO_FRAME_H,
  SPONSOR_LOGO_IMG_CLASS,
  SPONSOR_LOGO_SLOT_H,
  SPONSOR_LOGO_SLOT_W,
  SPONSOR_LOGO_STRIP_CLASS,
  sponsorMarqueeDurationSec,
} from "@/lib/sponsor-logo-carousel-variants";

interface Props {
  logos: string[];
  label?: string;
  showPartnersLabel?: boolean;
}

function LogoImg({
  src,
  index,
  total,
}: {
  src: string;
  index: number;
  total: number;
}) {
  return (
    <img
      src={src}
      alt={`Partner logo ${index + 1} of ${total}`}
      className={SPONSOR_LOGO_IMG_CLASS}
      loading={index === 0 ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function HomeSponsorLogoCarousel({
  logos,
  label = "Partner logos",
  showPartnersLabel = true,
}: Props) {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (logos.length === 0) return null;

  const durationSec = sponsorMarqueeDurationSec(logos.length);
  const track = logos.length > 1 ? [...logos, ...logos] : logos;

  return (
    <section
      className="mx-auto w-full max-w-md sm:max-w-lg"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {showPartnersLabel && (
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-sd-muted/60">
          In partnership with
        </p>
      )}
      <div className={SPONSOR_LOGO_STRIP_CLASS}>
        {logos.length === 1 ? (
          <div
            className={`flex ${SPONSOR_LOGO_FRAME_H} items-center justify-center`}
          >
            <div
              className={`flex items-center justify-center ${SPONSOR_LOGO_SLOT_W} ${SPONSOR_LOGO_SLOT_H}`}
            >
              <LogoImg src={logos[0]} index={0} total={1} />
            </div>
          </div>
        ) : (
          <div className={`${SPONSOR_LOGO_FRAME_H} overflow-hidden`}>
            <div
              className={`flex h-full w-max items-center gap-6 ${
                reducedMotion ? "" : "animate-sponsor-marquee"
              } ${paused && !reducedMotion ? "[animation-play-state:paused]" : ""}`}
              style={
                reducedMotion
                  ? undefined
                  : { animationDuration: `${durationSec}s` }
              }
            >
              {track.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className={`flex shrink-0 items-center justify-center ${SPONSOR_LOGO_SLOT_W} ${SPONSOR_LOGO_SLOT_H}`}
                >
                  <LogoImg
                    src={src}
                    index={i % logos.length}
                    total={logos.length}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
