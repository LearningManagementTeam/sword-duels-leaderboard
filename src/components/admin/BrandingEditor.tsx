"use client";

import Image from "next/image";
import { useState } from "react";
import { HeroLogo } from "@/components/branding/HeroLogo";
import { HomePhotoCarousel } from "@/components/home/HomePhotoCarousel";
import { LeaderboardBanner } from "@/components/leaderboard/LeaderboardBanner";
import {
  removeBrandingLogo,
  removeCarouselSlide,
  saveBrandingAlt,
  uploadBrandingLogo,
  uploadCarouselSlide,
} from "@/lib/actions/admin";
import {
  CAROUSEL_SLOT_COUNT,
  CAROUSEL_UPLOAD_SPECS,
  getActiveCarouselSlides,
  type BrandingConfig,
} from "@/lib/branding";

interface Props {
  initial: BrandingConfig;
}

export function BrandingEditor({ initial }: Props) {
  const [branding, setBranding] = useState(initial);
  const [alt, setAlt] = useState(initial.logo_alt);
  const [logoBusy, setLogoBusy] = useState(false);
  const [carouselBusySlot, setCarouselBusySlot] = useState<1 | 2 | 3 | null>(
    null
  );
  const [message, setMessage] = useState("");

  const activeSlides = getActiveCarouselSlides(branding);

  async function handleLogoUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLogoBusy(true);
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const result = await uploadBrandingLogo(fd);
      if (result.logo_url) {
        setBranding((b) => ({ ...b, logo_url: result.logo_url }));
      }
      setMessage("Logo uploaded. Public site updated.");
      form.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleCarouselUpload(
    e: React.FormEvent<HTMLFormElement>,
    slot: 1 | 2 | 3
  ) {
    e.preventDefault();
    if (carouselBusySlot !== null) return;
    setCarouselBusySlot(slot);
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("slot", String(slot));
    try {
      const result = await uploadCarouselSlide(fd);
      if (result.url) {
        setBranding((b) => {
          const slides = [...b.carousel_slides] as BrandingConfig["carousel_slides"];
          slides[slot - 1] = result.url;
          return { ...b, carousel_slides: slides };
        });
      }
      setMessage(`Photo ${slot} uploaded. Home carousel updated.`);
      form.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCarouselBusySlot(null);
    }
  }

  async function handleRemoveCarousel(slot: 1 | 2 | 3) {
    setCarouselBusySlot(slot);
    setMessage("");
    try {
      await removeCarouselSlide(slot);
      setBranding((b) => {
        const slides = [...b.carousel_slides] as BrandingConfig["carousel_slides"];
        slides[slot - 1] = null;
        return { ...b, carousel_slides: slides };
      });
      setMessage(`Photo ${slot} removed.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setCarouselBusySlot(null);
    }
  }

  async function handleRemoveLogo() {
    setLogoBusy(true);
    setMessage("");
    try {
      await removeBrandingLogo();
      setBranding((b) => ({ ...b, logo_url: null }));
      setMessage("Logo removed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleSaveAlt() {
    setLogoBusy(true);
    setMessage("");
    try {
      await saveBrandingAlt(alt);
      setBranding((b) => ({ ...b, logo_alt: alt }));
      setMessage("Alt text saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLogoBusy(false);
    }
  }

  const specs = CAROUSEL_UPLOAD_SPECS;

  return (
    <div className="space-y-8">
      <p className="text-sm text-sd-muted">
        Page backgrounds use the built-in animated gradient mesh. Upload the hero logo
        and up to three home carousel photos here.
      </p>

      <section className="sd-neon-panel space-y-4 p-6">
        <h2 className="font-semibold text-sd-glow">Home photo carousel</h2>
        <p className="text-sm text-sd-muted">
          One rotating carousel on the home page (replaces the old text tickers). Upload
          up to {CAROUSEL_SLOT_COUNT} landscape photos — JPG, PNG, or WebP,{" "}
          {specs.maxSizeLabel}. {specs.recommendedLabel}.
        </p>

        {activeSlides.length > 0 && (
          <div className="max-w-2xl">
            <p className="mb-2 text-xs uppercase tracking-wider text-sd-muted/70">
              Preview
            </p>
            <HomePhotoCarousel slides={activeSlides} />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {([1, 2, 3] as const).map((slot) => {
            const url = branding.carousel_slides[slot - 1];
            const slotBusy = carouselBusySlot === slot;
            return (
              <div
                key={slot}
                className="sd-inset space-y-3 rounded-xl p-4"
              >
                <p className="text-sm font-medium text-white">Photo {slot}</p>
                {url ? (
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-sd-deep">
                    <Image
                      src={url}
                      alt={`Carousel slot ${slot}`}
                      fill
                      className="object-cover"
                      sizes="200px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-emerald-500/25 bg-sd-deep/40 px-3 py-4 text-center">
                    <span className="text-xs font-medium text-sd-muted/90">
                      No photo yet
                    </span>
                    {specs.emptyPlaceholderLines.map((line) => (
                      <span
                        key={line}
                        className="text-[11px] leading-snug text-sd-muted/65"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={(e) => handleCarouselUpload(e, slot)}
                  className="space-y-2"
                >
                  <input
                    type="file"
                    name="file"
                    accept={specs.accept}
                    className="block w-full text-xs text-sd-muted"
                  />
                  <button
                    type="submit"
                    disabled={slotBusy}
                    aria-busy={slotBusy}
                    className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      slotBusy
                        ? "cursor-wait bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep ring-2 ring-emerald-300/50"
                        : "sd-btn-primary"
                    }`}
                  >
                    {slotBusy
                      ? "Uploading…"
                      : url
                        ? "Replace"
                        : "Upload"}
                  </button>
                </form>
                {url && (
                  <button
                    type="button"
                    disabled={slotBusy}
                    onClick={() => handleRemoveCarousel(slot)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove photo {slot}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="sd-neon-panel space-y-3 p-6">
        <h2 className="font-semibold text-sd-glow">Hero logo preview</h2>
        <p className="text-sm text-sd-muted">
          Nearly full width on mobile, like a game title screen. PNG or SVG with a
          transparent background works best.
        </p>
        <HeroLogo branding={branding} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sd-glow">Leaderboard strip preview</h2>
        <div className="rounded-xl border border-sd-glow/20 bg-sd-deep p-4">
          <LeaderboardBanner subtitle="June — Luzon · After Round 1" />
        </div>
      </section>

      <form onSubmit={handleLogoUpload} className="sd-neon-panel space-y-3 p-6">
        <h2 className="font-semibold text-white">Upload logo</h2>
        <p className="text-sm text-sd-muted">
          PNG, JPG, WebP, or SVG · max 2MB · hero splash + small header icon.
        </p>
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="block text-sm text-sd-muted"
        />
        <button
          type="submit"
          disabled={logoBusy}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {logoBusy ? "Uploading…" : "Upload logo"}
        </button>
      </form>

      <div className="sd-neon-panel space-y-2 p-6">
        <label className="block text-sm font-medium text-sd-muted">
          Logo alt text (accessibility)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="sd-input flex-1 min-w-[200px] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={logoBusy}
            onClick={handleSaveAlt}
            className="rounded-lg border border-fuchsia-400/30 px-4 py-2 text-sm text-sd-muted hover:text-white"
          >
            Save alt text
          </button>
        </div>
      </div>

      {branding.logo_url && (
        <button
          type="button"
          disabled={logoBusy}
          onClick={handleRemoveLogo}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Remove logo
        </button>
      )}

      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
