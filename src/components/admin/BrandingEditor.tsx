"use client";

import { useRef, useState } from "react";
import { HeroLogo } from "@/components/branding/HeroLogo";
import { HomePhotoCarousel } from "@/components/home/HomePhotoCarousel";
import { LeaderboardBanner } from "@/components/leaderboard/LeaderboardBanner";
import {
  removeBrandingLogo,
  saveBrandingAlt,
  uploadBrandingLogo,
} from "@/lib/actions/admin";
import {
  CAROUSEL_SLOT_COUNT,
  CAROUSEL_UPLOAD_SPECS,
  getActiveCarouselSlides,
  type BrandingConfig,
  type CarouselSlides,
} from "@/lib/branding";
import type { CarouselMutationResult } from "@/lib/branding-carousel";
import {
  checkCarouselUploadFile,
  checkLogoUploadFile,
  LOGO_UPLOAD_SPECS,
  type BrandingFileCheck,
} from "@/lib/branding-upload-validation";

interface Props {
  initial: BrandingConfig;
}

type CarouselPhase = "idle" | "uploading" | "removing" | "success" | "error";

type CarouselStatus = {
  phase: CarouselPhase;
  slot?: 1 | 2 | 3;
  message: string;
};

function applyCarouselSlides(
  branding: BrandingConfig,
  slides: CarouselSlides
): BrandingConfig {
  return { ...branding, carousel_slides: slides };
}

async function postCarouselUpload(
  fd: FormData
): Promise<CarouselMutationResult> {
  const res = await fetch("/api/admin/branding/carousel", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const data = (await res.json()) as CarouselMutationResult & {
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  return data;
}

async function deleteCarouselSlot(slot: 1 | 2 | 3): Promise<CarouselMutationResult> {
  const res = await fetch(`/api/admin/branding/carousel?slot=${slot}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = (await res.json()) as CarouselMutationResult & {
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `Remove failed (${res.status})`);
  }
  return data;
}

function formatUploadError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Upload failed";
}

function FilePickNotice({ check }: { check: BrandingFileCheck | undefined }) {
  if (!check) return null;
  if (check.ok) {
    return (
      <p role="status" className="text-xs text-emerald-200/90">
        Ready: {check.fileName} ({check.sizeLabel})
      </p>
    );
  }
  return (
    <p role="alert" className="rounded-lg bg-amber-950/40 px-2 py-1.5 text-xs text-amber-100">
      {check.message}
    </p>
  );
}

function CarouselStatusBanner({ status }: { status: CarouselStatus }) {
  if (status.phase === "idle") return null;

  const styles: Record<Exclude<CarouselPhase, "idle">, string> = {
    uploading: "sd-alert-info border-emerald-500/30 text-emerald-100",
    removing: "sd-alert-info border-emerald-500/30 text-emerald-100",
    success: "sd-alert-info border-emerald-500/40 text-emerald-100",
    error: "sd-alert-warning",
  };

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-xl px-4 py-3 text-sm ${styles[status.phase]}`}
    >
      {status.phase === "uploading" && (
        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent align-middle" />
      )}
      {status.message}
    </p>
  );
}

export function BrandingEditor({ initial }: Props) {
  const [branding, setBranding] = useState(initial);
  const [alt, setAlt] = useState(initial.logo_alt);
  const [logoBusy, setLogoBusy] = useState(false);
  const [carouselBusySlot, setCarouselBusySlot] = useState<1 | 2 | 3 | null>(
    null
  );
  const [carouselStatus, setCarouselStatus] = useState<CarouselStatus>({
    phase: "idle",
    message: "",
  });
  const [slotLoadErrors, setSlotLoadErrors] = useState<
    Partial<Record<1 | 2 | 3, boolean>>
  >({});
  const [slotFileChecks, setSlotFileChecks] = useState<
    Partial<Record<1 | 2 | 3, BrandingFileCheck>>
  >({});
  const [logoFileCheck, setLogoFileCheck] = useState<
    BrandingFileCheck | undefined
  >();
  const [message, setMessage] = useState("");
  const fileInputRefs = useRef<Record<1 | 2 | 3, HTMLInputElement | null>>({
    1: null,
    2: null,
    3: null,
  });

  const carouselLocked = carouselBusySlot !== null;
  const activeSlides = getActiveCarouselSlides(branding);
  const specs = CAROUSEL_UPLOAD_SPECS;

  function handleCarouselFileChange(slot: 1 | 2 | 3) {
    const input = fileInputRefs.current[slot];
    const file = input?.files?.[0];
    const check = checkCarouselUploadFile(file);
    setSlotFileChecks((prev) => ({ ...prev, [slot]: check }));

    if (!check.ok) {
      setCarouselStatus({
        phase: "error",
        slot,
        message: check.message,
      });
      return;
    }

    if (carouselStatus.phase === "error" && carouselStatus.slot === slot) {
      setCarouselStatus({ phase: "idle", message: "" });
    }
  }

  async function handleCarouselUpload(slot: 1 | 2 | 3) {
    if (carouselLocked) return;

    const input = fileInputRefs.current[slot];
    const file = input?.files?.[0];
    const check = checkCarouselUploadFile(file);
    setSlotFileChecks((prev) => ({ ...prev, [slot]: check }));

    if (!check.ok) {
      setCarouselStatus({
        phase: "error",
        slot,
        message: check.message,
      });
      return;
    }

    setCarouselBusySlot(slot);
    setCarouselStatus({
      phase: "uploading",
      slot,
      message: `Uploading photo ${slot}… Please wait — other slots are locked until this finishes.`,
    });
    setMessage("");

    const fd = new FormData();
    fd.set("file", file!);
    fd.set("slot", String(slot));

    try {
      const result = await postCarouselUpload(fd);
      setBranding((b) => applyCarouselSlides(b, result.carousel_slides));
      setSlotLoadErrors((prev) => ({ ...prev, [slot]: false }));
      setSlotFileChecks((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      if (input) input.value = "";

      setCarouselStatus({
        phase: "success",
        slot,
        message: `Photo ${slot} saved. Home carousel preview updated below.`,
      });
      setMessage(`Photo ${slot} uploaded.`);
    } catch (err) {
      const text = formatUploadError(err);
      setCarouselStatus({ phase: "error", slot, message: text });
      setMessage(text);
    } finally {
      setCarouselBusySlot(null);
    }
  }

  async function handleRemoveCarousel(slot: 1 | 2 | 3) {
    if (carouselLocked) return;
    if (!confirm(`Remove photo ${slot} from the home carousel?`)) return;

    setCarouselBusySlot(slot);
    setCarouselStatus({
      phase: "removing",
      slot,
      message: `Removing photo ${slot}…`,
    });
    setMessage("");

    try {
      const result = await deleteCarouselSlot(slot);
      setBranding((b) => applyCarouselSlides(b, result.carousel_slides));
      setCarouselStatus({
        phase: "success",
        slot,
        message: `Photo ${slot} removed.`,
      });
      setMessage(`Photo ${slot} removed.`);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Remove failed";
      setCarouselStatus({ phase: "error", slot, message: text });
      setMessage(text);
    } finally {
      setCarouselBusySlot(null);
    }
  }

  async function handleLogoUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (carouselLocked) return;

    const form = e.currentTarget;
    const file = form.elements.namedItem("file") as HTMLInputElement | null;
    const check = checkLogoUploadFile(file?.files?.[0]);
    setLogoFileCheck(check);

    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    setLogoBusy(true);
    setMessage("");
    const fd = new FormData(form);
    try {
      const result = await uploadBrandingLogo(fd);
      if (result.logo_url) {
        setBranding((b) => ({ ...b, logo_url: result.logo_url }));
      }
      setMessage("Logo uploaded. Public site updated.");
      setLogoFileCheck(undefined);
      form.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleRemoveLogo() {
    if (carouselLocked) return;
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
    if (carouselLocked) return;
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

  return (
    <div className="space-y-8">
      <p className="text-sm text-sd-muted">
        Page backgrounds use the built-in animated gradient mesh. Upload the hero logo
        and up to three home carousel photos here. Only one carousel photo uploads at a
        time.
      </p>

      <section className="sd-neon-panel space-y-4 p-6">
        <h2 className="font-semibold text-sd-glow">Home photo carousel</h2>
        <p className="text-sm text-sd-muted">
          One rotating carousel on the home page. Upload up to {CAROUSEL_SLOT_COUNT}{" "}
          landscape photos — JPG, PNG, or WebP, {specs.maxSizeLabel}.{" "}
          {specs.recommendedLabel}.
        </p>

        <CarouselStatusBanner status={carouselStatus} />

        <div className="max-w-2xl">
          <p className="mb-2 text-xs uppercase tracking-wider text-sd-muted/70">
            Carousel preview ({activeSlides.length} of {CAROUSEL_SLOT_COUNT} filled)
          </p>
          {activeSlides.length > 0 ? (
            <HomePhotoCarousel slides={activeSlides} />
          ) : (
            <div className="sd-inset flex aspect-video max-h-48 items-center justify-center rounded-xl px-4 text-center text-sm text-sd-muted">
              {carouselLocked
                ? "Preview will update when the current upload finishes…"
                : "Upload at least one photo to see the home carousel preview."}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {([1, 2, 3] as const).map((slot) => {
            const url = branding.carousel_slides[slot - 1];
            const isThisSlotBusy = carouselBusySlot === slot;
            const fileCheck = slotFileChecks[slot];
            const uploadBlocked =
              carouselLocked || (fileCheck !== undefined && !fileCheck.ok);
            return (
              <div
                key={slot}
                className={`sd-inset space-y-3 rounded-xl p-4 transition ${
                  isThisSlotBusy ? "ring-2 ring-sd-glow/50" : ""
                }`}
              >
                <p className="text-sm font-medium text-white">
                  Photo {slot}
                  {isThisSlotBusy && (
                    <span className="ml-2 text-xs font-normal text-sd-glow">
                      Working…
                    </span>
                  )}
                </p>
                {url ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-sd-deep">
                      <img
                        src={url}
                        alt={`Carousel slot ${slot}`}
                        className="h-full w-full object-cover"
                        onLoad={() =>
                          setSlotLoadErrors((prev) => ({
                            ...prev,
                            [slot]: false,
                          }))
                        }
                        onError={() =>
                          setSlotLoadErrors((prev) => ({ ...prev, [slot]: true }))
                        }
                      />
                    </div>
                    {slotLoadErrors[slot] && (
                      <p className="text-xs text-amber-200/90">
                        This photo link is broken. Click{" "}
                        <strong>Remove photo {slot}</strong>, then upload the file
                        again.
                      </p>
                    )}
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
                <div className="space-y-2">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot] = el;
                    }}
                    type="file"
                    accept={specs.accept}
                    disabled={carouselLocked}
                    className="block w-full text-xs text-sd-muted disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={() => handleCarouselFileChange(slot)}
                  />
                  <FilePickNotice check={fileCheck} />
                  <button
                    type="button"
                    disabled={uploadBlocked}
                    aria-busy={isThisSlotBusy}
                    onClick={() => handleCarouselUpload(slot)}
                    className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isThisSlotBusy
                        ? "cursor-wait bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep ring-2 ring-emerald-300/50"
                        : "sd-btn-primary"
                    }`}
                  >
                    {isThisSlotBusy
                      ? "Uploading…"
                      : url
                        ? "Replace photo"
                        : "Upload photo"}
                  </button>
                </div>
                {url && (
                  <button
                    type="button"
                    disabled={carouselLocked}
                    onClick={() => handleRemoveCarousel(slot)}
                    className="text-xs text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove photo {slot}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {carouselLocked && (
          <p className="text-xs text-sd-muted/80">
            Another carousel action is in progress — all carousel controls are locked
            until it completes.
          </p>
        )}
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
          PNG, JPG, WebP, or SVG · max {LOGO_UPLOAD_SPECS.maxSizeLabel} · hero splash +
          small header icon.
        </p>
        <input
          type="file"
          name="file"
          accept={LOGO_UPLOAD_SPECS.accept}
          disabled={logoBusy || carouselLocked}
          className="block text-sm text-sd-muted disabled:opacity-50"
          onChange={(e) => {
            const check = checkLogoUploadFile(e.target.files?.[0]);
            setLogoFileCheck(check);
            if (!check.ok) {
              setMessage(check.message);
            } else {
              setMessage("");
            }
          }}
        />
        <FilePickNotice check={logoFileCheck} />
        <button
          type="submit"
          disabled={
            logoBusy || carouselLocked || (logoFileCheck !== undefined && !logoFileCheck.ok)
          }
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
            disabled={carouselLocked}
            className="sd-input flex-1 min-w-[200px] px-3 py-2 text-sm disabled:opacity-50"
          />
          <button
            type="button"
            disabled={logoBusy || carouselLocked}
            onClick={handleSaveAlt}
            className="rounded-lg border border-fuchsia-400/30 px-4 py-2 text-sm text-sd-muted hover:text-white disabled:opacity-50"
          >
            Save alt text
          </button>
        </div>
      </div>

      {branding.logo_url && (
        <button
          type="button"
          disabled={logoBusy || carouselLocked}
          onClick={handleRemoveLogo}
          className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          Remove logo
        </button>
      )}

      {message && <p className="text-sm text-sd-glow">{message}</p>}
    </div>
  );
}
