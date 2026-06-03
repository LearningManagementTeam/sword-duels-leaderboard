"use client";

import { useCallback, useEffect, useState } from "react";

const ROTATE_MS = 7000;
const SLIDE_MS = 800;

interface Props {
  logos: string[];
  label?: string;
}

export function HomeSponsorLogoCarousel({
  logos,
  label = "Partner logos",
}: Props) {
  const [pos, setPos] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const loop = logos.length > 1;
  const trackLogos = loop ? [...logos, logos[0]] : logos;
  const dotIndex = loop && pos === logos.length ? 0 : pos;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goNext = useCallback(() => {
    if (!loop) return;
    setPos((p) => (p >= logos.length ? 0 : p + 1));
  }, [loop, logos.length]);

  useEffect(() => {
    if (!loop || paused || reducedMotion) return;
    const id = window.setInterval(goNext, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [loop, paused, reducedMotion, goNext]);

  useEffect(() => {
    if (pos < trackLogos.length) return;
    setPos(0);
  }, [pos, trackLogos.length]);

  const handleTransitionEnd = () => {
    if (!loop || pos !== logos.length) return;
    setNoTransition(true);
    setPos(0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoTransition(false));
    });
  };

  const goTo = (target: number) => {
    setNoTransition(false);
    setPos(target);
  };

  if (logos.length === 0) return null;

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
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-sd-muted/60">
        In partnership with
      </p>
      <div className="relative overflow-hidden rounded-xl bg-sd-deep/30 px-4 py-3 ring-1 ring-emerald-500/10">
        <div
          className="flex h-11 sm:h-12"
          style={{
            width: `${trackLogos.length * 100}%`,
            transform: `translateX(-${(pos * 100) / trackLogos.length}%)`,
            transition: noTransition
              ? "none"
              : `transform ${SLIDE_MS}ms ease-in-out`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackLogos.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="flex h-full shrink-0 items-center justify-center px-6"
              style={{ width: `${100 / trackLogos.length}%` }}
              aria-hidden={loop ? i !== pos && !(pos === logos.length && i === 0) : false}
            >
              <img
                src={src}
                alt={`Partner logo ${(i % logos.length) + 1} of ${logos.length}`}
                className="max-h-9 max-w-[140px] object-contain object-center opacity-90 sm:max-h-10 sm:max-w-[160px]"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {loop && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {logos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show partner logo ${i + 1} of ${logos.length}`}
              aria-current={i === dotIndex ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all ${
                i === dotIndex
                  ? "w-4 bg-emerald-400/90"
                  : "w-1 bg-emerald-900/60 hover:bg-emerald-600/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
