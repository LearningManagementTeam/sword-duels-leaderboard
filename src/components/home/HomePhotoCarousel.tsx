"use client";

import { useCallback, useEffect, useState } from "react";

const ROTATE_MS = 5000;
const SLIDE_MS = 600;

/** Fixed 16:9 frame — every slide fills the same box (object-cover). */
const FRAME_CLASS =
  "relative mx-auto aspect-video w-full max-w-lg overflow-hidden";

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
      className="mx-auto w-full max-w-lg"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={FRAME_CLASS}>
        <div
          className="flex h-full w-full"
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
              <img
                src={src}
                alt={`Featured photo ${(i % slides.length) + 1} of ${slides.length}`}
                className="block h-full w-full object-cover object-center"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {loop && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === dotIndex ? "true" : undefined}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === dotIndex
                  ? "w-5 bg-emerald-400"
                  : "w-1.5 bg-emerald-800/70 hover:bg-emerald-600/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
