"use client";

import { useState } from "react";
import { BackgroundPreview } from "@/components/branding/BackgroundPreview";
import { HeroLogo } from "@/components/branding/HeroLogo";
import { LeaderboardBanner } from "@/components/leaderboard/LeaderboardBanner";
import {
  removeBrandingBackground,
  removeBrandingLogo,
  saveBrandingAlt,
  uploadBrandingBackground,
  uploadBrandingLogo,
} from "@/lib/actions/admin";
import {
  BACKGROUND_UPLOAD_SPECS,
  type BrandingConfig,
} from "@/lib/branding";
import { validateBackgroundFile } from "@/lib/validate-background-file";

interface Props {
  initial: BrandingConfig;
}

export function BrandingEditor({ initial }: Props) {
  const [branding, setBranding] = useState(initial);
  const [alt, setAlt] = useState(initial.logo_alt);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  async function handleBackgroundUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setMessage("Choose an image file to upload.");
      setLoading(false);
      return;
    }
    const validationError = await validateBackgroundFile(file);
    if (validationError) {
      setMessage(validationError);
      setLoading(false);
      return;
    }
    const fd = new FormData(form);
    try {
      const result = await uploadBrandingBackground(fd);
      if (result.background_url) {
        setBranding((b) => ({ ...b, background_url: result.background_url }));
      }
      setMessage("Background uploaded. All pages updated.");
      form.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
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

  async function handleRemoveBackground() {
    setLoading(true);
    setMessage("");
    try {
      await removeBrandingBackground();
      setBranding((b) => ({ ...b, background_url: null }));
      setMessage("Custom background removed. Default wave art restored.");
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

  const specs = BACKGROUND_UPLOAD_SPECS;

  return (
    <div className="space-y-8">
      <section className="sd-neon-panel space-y-4 p-6">
        <h2 className="font-semibold text-sd-glow">Page background</h2>
        <p className="text-sm text-sd-muted">
          Shown behind every public and admin page (soft blur + dark overlay so
          text stays readable).
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-sd-muted">
          <li>
            <strong className="text-white">Recommended:</strong>{" "}
            {specs.recommendedLabel}
          </li>
          <li>
            <strong className="text-white">Minimum:</strong> {specs.minWidthLabel}
          </li>
          <li>
            <strong className="text-white">Orientation:</strong> {specs.aspectHint}
          </li>
          <li>
            <strong className="text-white">Formats:</strong> JPG, PNG, or WebP · max{" "}
            {specs.maxSizeLabel}
          </li>
        </ul>
        <BackgroundPreview branding={branding} label="Live preview" />
        <form onSubmit={handleBackgroundUpload} className="space-y-3">
          <input
            type="file"
            name="file"
            accept={specs.accept}
            className="block w-full max-w-md text-sm text-sd-muted file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-sd-lime file:to-emerald-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sd-deep"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="sd-btn-primary rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {loading ? "Uploading…" : "Upload background"}
            </button>
            {branding.background_url && (
              <button
                type="button"
                disabled={loading}
                onClick={handleRemoveBackground}
                className="sd-btn-ghost rounded-lg px-4 py-2 text-sm"
              >
                Restore default background
              </button>
            )}
          </div>
        </form>
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
