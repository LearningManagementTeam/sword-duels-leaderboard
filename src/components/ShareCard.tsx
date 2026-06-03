"use client";

import { useState } from "react";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

interface Props {
  url: string;
  title?: string;
}

function normalizeShareUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (
    trimmed.includes(".vercel.app") &&
    !trimmed.startsWith(PRODUCTION_SITE_URL)
  ) {
    return PRODUCTION_SITE_URL;
  }
  return trimmed || PRODUCTION_SITE_URL;
}

export function ShareCard({ url, title = "Share this leaderboard" }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = normalizeShareUrl(url);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="sd-neon-panel mx-auto max-w-md p-6 text-center sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sd-glow/90">
        Spread the word
      </p>
      <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-sd-muted">
        Scan the code or copy the link so branches can follow live standings.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrSrc}
        alt="QR code for public leaderboard URL"
        width={180}
        height={180}
        className="sd-inset mx-auto mt-5 rounded-2xl p-3"
      />

      <div className="mx-auto mt-5 w-full max-w-xs space-y-2">
        <button
          type="button"
          onClick={copyLink}
          className="sd-btn-primary w-full rounded-2xl px-6 py-3 text-sm font-semibold"
        >
          {copied ? "Link copied!" : "Copy link"}
        </button>
        <p className="break-all text-[10px] leading-relaxed text-sd-muted/60">
          {shareUrl}
        </p>
      </div>
    </section>
  );
}
