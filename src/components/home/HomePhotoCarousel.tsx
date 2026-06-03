"use client";

import { useCallback, useEffect, useState } from "react";

const ROTATE_MS = 5000;
const SLIDE_MS = 600;

interface Props {
  slides: string[];
  label?: string;
}

export function HomePhotoCarousel({
  slides,
  label = "Featured photos",
}: Props) {
  const [pos, setPos] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const loop = slides.length > 1;
  const trackSlides = loop ? [...slides, slides[0]] : slides;
  const dotIndex = loop && pos === slides.length ? 0 : pos;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const goNext = useCallback(() => {
    if (!loop) return;
    setPos((p) => (p >= slides.length ? 0 : p + 1));
  }, [loop, slides.length]);

  useEffect(() => {
    if (!loop || paused || reducedMotion) return;
    const id = window.setInterval(goNext, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [loop, paused, reducedMotion, goNext]);

  useEffect(() => {
    if (pos < trackSlides.length) return;
    setPos(0);
  }, [pos, trackSlides.length]);

  const handleTransitionEnd = () => {
    if (!loop || pos !== slides.length) return;
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

  if (slides.length === 0) return null;

  return (
    <section
      className="sd-neon-panel mx-auto w-full max-w-[18rem] overflow-hidden p-2.5 sm:max-w-sm sm:p-3 md:max-w-md"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="sd-inset relative aspect-[16/9] max-h-[10.5rem] overflow-hidden rounded-xl bg-sd-deep sm:max-h-[12rem] md:max-h-[13.5rem]">
        <div
          className="flex h-full"
          style={{
            width: `${trackSlides.length * 100}%`,
            transform: `translateX(-${(pos * 100) / trackSlides.length}%)`,
            transition: noTransition
              ? "none"
              : `transform ${SLIDE_MS}ms ease-in-out`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackSlides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-full shrink-0 overflow-hidden"
              style={{ width: `${100 / trackSlides.length}%` }}
              aria-hidden={i !== pos}
            >
              {/* Native img: Supabase URLs + cache-bust query must not go through next/image */}
              <img
                src={src}
                alt={`Featured photo ${(i % slides.length) + 1} of ${slides.length}`}
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-sd-deep/40 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      {loop && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === dotIndex ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === dotIndex
                  ? "w-6 bg-gradient-to-r from-sd-lime to-emerald-400"
                  : "w-2 bg-emerald-900/80 hover:bg-emerald-600/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
