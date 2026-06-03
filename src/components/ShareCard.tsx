"use client";

import { useState } from "react";

interface Props {
  url: string;
  title?: string;
}

export function ShareCard({ url, title = "Share this leaderboard" }: Props) {
  const [copied, setCopied] = useState(false);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
      <h3 className="font-semibold text-amber-300">{title}</h3>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrSrc}
          alt="QR code for public leaderboard URL"
          width={160}
          height={160}
          className="rounded-lg border border-slate-600 bg-white p-2"
        />
        <div className="flex-1 space-y-3 text-sm">
          <p className="text-slate-400">
            Scan or share this link so branches can follow live standings.
          </p>
          <code className="block break-all rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-300">
            {url}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
