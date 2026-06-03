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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const activeSlides = getActiveCarouselSlides(branding);

  async function handleLogoUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
    }
  }

  async function handleCarouselUpload(
    e: React.FormEvent<HTMLFormElement>,
    slot: 1 | 2 | 3
  ) {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
    }
  }

  async function handleRemoveCarousel(slot: 1 | 2 | 3) {
    setLoading(true);
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
      setLoading(false);
    }
  }

  async function handleRemoveLogo() {
    setLoading(true);
    setMessage("");
    try {
      await removeBrandingLogo();
      setBranding((b) => ({ ...b, logo_url: null }));
      setMessage("Logo removed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAlt() {
    setLoading(true);
    setMessage("");
    try {
      await saveBrandingAlt(alt);
      setBranding((b) => ({ ...b, logo_alt: alt }));
      setMessage("Alt text saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
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
                  <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-emerald-500/25 text-xs text-sd-muted">
                    Empty
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
                    disabled={loading}
                    className="sd-btn-primary w-full rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    {url ? "Replace" : "Upload"}
                  </button>
                </form>
                {url && (
                  <button
                    type="button"
                    disabled={loading}
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
          disabled={loading}
          className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload logo"}
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
            disabled={loading}
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
          disabled={loading}
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
