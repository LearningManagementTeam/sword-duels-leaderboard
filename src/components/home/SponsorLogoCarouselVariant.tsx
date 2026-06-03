"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SPONSOR_LOGO_VARIANT,
  SPONSOR_LOGO_FRAME_H,
  SPONSOR_LOGO_IMG_CLASS,
  SPONSOR_LOGO_ROTATE_MS,
  SPONSOR_LOGO_STRIP_CLASS,
  SPONSOR_LOGO_TRANSITION_MS,
  type SponsorLogoCarouselVariantId,
} from "@/lib/sponsor-logo-carousel-variants";

interface Props {
  logos: string[];
  variant?: SponsorLogoCarouselVariantId;
  label?: string;
  showPartnersLabel?: boolean;
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reducedMotion;
}

function useTimedIndex(count: number, paused: boolean) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const loop = count > 1;

  useEffect(() => {
    if (!loop || paused || reducedMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, SPONSOR_LOGO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count, loop, paused, reducedMotion]);

  return { index, setIndex, loop };
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

function Dots({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  if (count <= 1) return null;
  return (
    <div className="mt-2 flex items-center justify-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Show partner logo ${i + 1} of ${count}`}
          aria-current={i === active ? "true" : undefined}
          onClick={() => onSelect(i)}
          className={`h-1 rounded-full transition-all ${
            i === active
              ? "w-4 bg-emerald-400/90"
              : "w-1 bg-emerald-900/60 hover:bg-emerald-600/70"
          }`}
        />
      ))}
    </div>
  );
}

function SlideVariant({
  logos,
  paused,
}: {
  logos: string[];
  paused: boolean;
}) {
  const [pos, setPos] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const reducedMotion = useReducedMotion();
  const loop = logos.length > 1;
  const trackLogos = loop ? [...logos, logos[0]] : logos;
  const dotIndex = loop && pos === logos.length ? 0 : pos;

  const goNext = useCallback(() => {
    if (!loop) return;
    setPos((p) => (p >= logos.length ? 0 : p + 1));
  }, [loop, logos.length]);

  useEffect(() => {
    if (!loop || paused || reducedMotion) return;
    const id = window.setInterval(goNext, SPONSOR_LOGO_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [loop, paused, reducedMotion, goNext]);

  const handleTransitionEnd = () => {
    if (!loop || pos !== logos.length) return;
    setNoTransition(true);
    setPos(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoTransition(false));
    });
  };

  return (
    <>
      <div
        className={`flex ${SPONSOR_LOGO_FRAME_H}`}
        style={{
          width: `${trackLogos.length * 100}%`,
          transform: `translateX(-${(pos * 100) / trackLogos.length}%)`,
          transition: noTransition
            ? "none"
            : `transform ${SPONSOR_LOGO_TRANSITION_MS}ms ease-in-out`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {trackLogos.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="flex h-full shrink-0 items-center justify-center px-6"
            style={{ width: `${100 / trackLogos.length}%` }}
          >
            <LogoImg src={src} index={i % logos.length} total={logos.length} />
          </div>
        ))}
      </div>
      <Dots count={logos.length} active={dotIndex} onSelect={setPos} />
    </>
  );
}

function FadeVariant({
  logos,
  paused,
}: {
  logos: string[];
  paused: boolean;
}) {
  const { index, setIndex, loop } = useTimedIndex(logos.length, paused);

  return (
    <>
      <div className={`relative ${SPONSOR_LOGO_FRAME_H}`}>
        {logos.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 flex items-center justify-center px-6 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <LogoImg src={src} index={i} total={logos.length} />
          </div>
        ))}
      </div>
      {loop && (
        <Dots count={logos.length} active={index} onSelect={setIndex} />
      )}
    </>
  );
}

function ScaleFadeVariant({
  logos,
  paused,
}: {
  logos: string[];
  paused: boolean;
}) {
  const { index, setIndex, loop } = useTimedIndex(logos.length, paused);

  return (
    <>
      <div className={`relative ${SPONSOR_LOGO_FRAME_H}`}>
        {logos.map((src, i) => {
          const active = i === index;
          return (
            <div
              key={src}
              className="absolute inset-0 flex items-center justify-center px-6 transition-all duration-700 ease-out"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? "scale(1)" : "scale(0.92)",
              }}
              aria-hidden={!active}
            >
              <LogoImg src={src} index={i} total={logos.length} />
            </div>
          );
        })}
      </div>
      {loop && (
        <Dots count={logos.length} active={index} onSelect={setIndex} />
      )}
    </>
  );
}

function VerticalSlideVariant({
  logos,
  paused,
}: {
  logos: string[];
  paused: boolean;
}) {
  const { index, setIndex, loop } = useTimedIndex(logos.length, paused);

  return (
    <>
      <div className={`relative ${SPONSOR_LOGO_FRAME_H} overflow-hidden`}>
        <div
          className="flex flex-col transition-transform duration-700 ease-in-out"
          style={{ transform: `translateY(-${index * 100}%)` }}
        >
          {logos.map((src, i) => (
            <div
              key={src}
              className={`flex ${SPONSOR_LOGO_FRAME_H} shrink-0 items-center justify-center px-6`}
            >
              <LogoImg src={src} index={i} total={logos.length} />
            </div>
          ))}
        </div>
      </div>
      {loop && (
        <Dots count={logos.length} active={index} onSelect={setIndex} />
      )}
    </>
  );
}

function MarqueeVariant({ logos }: { logos: string[] }) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const track = [...logos, ...logos];
  const durationSec = Math.max(18, logos.length * 10);

  if (logos.length === 1) {
    return (
      <div className={`flex ${SPONSOR_LOGO_FRAME_H} items-center justify-center`}>
        <LogoImg src={logos[0]} index={0} total={1} />
      </div>
    );
  }

  return (
    <div
      className={`${SPONSOR_LOGO_FRAME_H} overflow-hidden`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`flex h-full w-max items-center gap-12 px-4 ${
          reducedMotion ? "" : "animate-sponsor-marquee"
        } ${paused && !reducedMotion ? "[animation-play-state:paused]" : ""}`}
        style={
          reducedMotion ? undefined : { animationDuration: `${durationSec}s` }
        }
      >
        {track.map((src, i) => (
          <div key={`${src}-${i}`} className="flex shrink-0 items-center">
            <LogoImg src={src} index={i % logos.length} total={logos.length} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StaticRowVariant({ logos }: { logos: string[] }) {
  return (
    <div
      className={`flex ${SPONSOR_LOGO_FRAME_H} flex-wrap items-center justify-center gap-6 px-2 sm:gap-10`}
    >
      {logos.map((src, i) => (
        <LogoImg key={src} src={src} index={i} total={logos.length} />
      ))}
    </div>
  );
}

function VariantBody({
  variant,
  logos,
  paused,
}: {
  variant: SponsorLogoCarouselVariantId;
  logos: string[];
  paused: boolean;
}) {
  switch (variant) {
    case "fade":
      return <FadeVariant logos={logos} paused={paused} />;
    case "marquee":
      return <MarqueeVariant logos={logos} />;
    case "static-row":
      return <StaticRowVariant logos={logos} />;
    case "scale-fade":
      return <ScaleFadeVariant logos={logos} paused={paused} />;
    case "vertical-slide":
      return <VerticalSlideVariant logos={logos} paused={paused} />;
    case "slide":
    default:
      return <SlideVariant logos={logos} paused={paused} />;
  }
}

export function SponsorLogoCarouselVariant({
  logos,
  variant = DEFAULT_SPONSOR_LOGO_VARIANT,
  label = "Partner logos",
  showPartnersLabel = true,
}: Props) {
  const [paused, setPaused] = useState(false);

  if (logos.length === 0) return null;

  const hoverPause =
    variant !== "marquee" && variant !== "static-row"
      ? {
          onMouseEnter: () => setPaused(true),
          onMouseLeave: () => setPaused(false),
          onFocusCapture: () => setPaused(true),
          onBlurCapture: () => setPaused(false),
        }
      : {};

  return (
    <section
      className="mx-auto w-full max-w-md sm:max-w-lg"
      aria-roledescription={variant === "static-row" ? undefined : "carousel"}
      aria-label={label}
      {...hoverPause}
    >
      {showPartnersLabel && (
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-sd-muted/60">
          In partnership with
        </p>
      )}
      <div className={SPONSOR_LOGO_STRIP_CLASS}>
        <VariantBody variant={variant} logos={logos} paused={paused} />
      </div>
    </section>
  );
}

export function HomeSponsorLogoCarousel(props: Omit<Props, "variant">) {
  return <SponsorLogoCarouselVariant {...props} variant="slide" />;
}
