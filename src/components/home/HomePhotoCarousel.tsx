"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const ROTATE_MS = 5000;

interface Props {
  slides: string[];
  label?: string;
}

export function HomePhotoCarousel({
  slides,
  label = "Featured photos",
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused || reducedMotion) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      ROTATE_MS
    );
    return () => window.clearInterval(id);
  }, [slides.length, paused, reducedMotion]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className="sd-neon-panel overflow-hidden p-3 sm:p-4"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="sd-inset relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-sd-deep">
        {slides.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={src}
              alt={`Featured photo ${i + 1} of ${slides.length}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 72rem"
              priority={i === 0}
            />
          </div>
        ))}
        <div
          className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-sd-deep/50 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index
                  ? "w-8 bg-gradient-to-r from-sd-lime to-emerald-400"
                  : "w-2.5 bg-emerald-900/80 hover:bg-emerald-600/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
