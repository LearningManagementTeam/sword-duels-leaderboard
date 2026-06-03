"use client";

import { useState } from "react";
import { LeaderboardBanner } from "@/components/leaderboard/LeaderboardBanner";
import {
  removeBrandingLogo,
  saveBrandingAlt,
  uploadBrandingLogo,
} from "@/lib/actions/admin";
import type { BrandingConfig } from "@/lib/branding";

interface Props {
  initial: BrandingConfig;
}

export function BrandingEditor({ initial }: Props) {
  const [branding, setBranding] = useState(initial);
  const [alt, setAlt] = useState(initial.logo_alt);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
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

  async function handleRemove() {
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

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-semibold text-sd-glow">Banner preview</h2>
        <div className="rounded-xl border border-sd-glow/20 bg-sd-deep p-6">
          <LeaderboardBanner
            branding={branding}
            subtitle="June — Luzon · After Round 1"
          />
        </div>
      </section>

      <form onSubmit={handleUpload} className="space-y-3">
        <h2 className="font-semibold text-white">Upload logo</h2>
        <p className="text-sm text-sd-muted">
          PNG, JPG, WebP, or SVG · max 2MB · appears in header and leaderboard
          banner.
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
          className="rounded-lg bg-sd-glow px-4 py-2 text-sm font-medium text-sd-deep hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload logo"}
        </button>
      </form>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-sd-muted">
          Logo alt text (accessibility)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="sd-input flex-1 rounded-lg px-3 py-2 text-sm min-w-[200px]"
          />
          <button
            type="button"
            disabled={loading}
            onClick={handleSaveAlt}
            className="rounded-lg border border-sd-glow/30 px-4 py-2 text-sm text-sd-muted hover:text-white"
          >
            Save alt text
          </button>
        </div>
      </div>

      {branding.logo_url && (
        <button
          type="button"
          disabled={loading}
          onClick={handleRemove}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Remove logo
        </button>
      )}

      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
