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
  CAROUSEL_SLOTS,
  CAROUSEL_UPLOAD_SPECS,
  getActiveCarouselSlides,
  getActiveSponsorLogos,
  SPONSOR_LOGO_SLOTS,
  SPONSOR_LOGO_UPLOAD_SPECS,
  type BrandingConfig,
  type CarouselSlides,
  type CarouselSlot,
  type SponsorLogoSlides,
  type SponsorLogoSlot,
} from "@/lib/branding";
import type { CarouselMutationResult } from "@/lib/branding-carousel";
import type { SponsorLogoMutationResult } from "@/lib/branding-sponsor-logos";
import {
  checkCarouselUploadFile,
  checkLogoUploadFile,
  checkSponsorLogoUploadFile,
  LOGO_UPLOAD_SPECS,
  type BrandingFileCheck,
} from "@/lib/branding-upload-validation";
import { HomeSponsorLogoCarousel } from "@/components/home/HomeSponsorLogoCarousel";

interface Props {
  initial: BrandingConfig;
}

type CarouselPhase = "idle" | "uploading" | "removing" | "success" | "error";

type CarouselStatus = {
  phase: CarouselPhase;
  slot?: CarouselSlot;
  message: string;
};

function applySponsorLogos(
  branding: BrandingConfig,
  logos: SponsorLogoSlides
): BrandingConfig {
  return { ...branding, sponsor_logos: logos };
}

async function postSponsorLogoUpload(
  fd: FormData
): Promise<SponsorLogoMutationResult> {
  const res = await fetch("/api/admin/branding/sponsor-logos", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const data = (await res.json()) as SponsorLogoMutationResult & {
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  return data;
}

async function deleteSponsorLogoSlot(
  slot: SponsorLogoSlot
): Promise<SponsorLogoMutationResult> {
  const res = await fetch(`/api/admin/branding/sponsor-logos?slot=${slot}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = (await res.json()) as SponsorLogoMutationResult & {
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `Remove failed (${res.status})`);
  }
  return data;
}

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

async function deleteCarouselSlot(slot: CarouselSlot): Promise<CarouselMutationResult> {
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
  const [carouselBusySlot, setCarouselBusySlot] = useState<CarouselSlot | null>(
    null
  );
  const [sponsorBusySlot, setSponsorBusySlot] = useState<SponsorLogoSlot | null>(
    null
  );
  const [carouselStatus, setCarouselStatus] = useState<CarouselStatus>({
    phase: "idle",
    message: "",
  });
  const [sponsorStatus, setSponsorStatus] = useState<CarouselStatus>({
    phase: "idle",
    message: "",
  });
  const [slotLoadErrors, setSlotLoadErrors] = useState<
    Partial<Record<CarouselSlot, boolean>>
  >({});
  const [slotFileChecks, setSlotFileChecks] = useState<
    Partial<Record<CarouselSlot, BrandingFileCheck>>
  >({});
  const [sponsorFileChecks, setSponsorFileChecks] = useState<
    Partial<Record<SponsorLogoSlot, BrandingFileCheck>>
  >({});
  const [sponsorLoadErrors, setSponsorLoadErrors] = useState<
    Partial<Record<SponsorLogoSlot, boolean>>
  >({});
  const [logoFileCheck, setLogoFileCheck] = useState<
    BrandingFileCheck | undefined
  >();
  const [message, setMessage] = useState("");
  const fileInputRefs = useRef<Record<CarouselSlot, HTMLInputElement | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
  });
  const sponsorInputRefs = useRef<
    Record<SponsorLogoSlot, HTMLInputElement | null>
  >({
    1: null,
    2: null,
    3: null,
  });

  const carouselLocked = carouselBusySlot !== null || sponsorBusySlot !== null;
  const sponsorLocked = carouselLocked || logoBusy;
  const activeSlides = getActiveCarouselSlides(branding);
  const activeSponsorLogos = getActiveSponsorLogos(branding);
  const specs = CAROUSEL_UPLOAD_SPECS;
  const sponsorSpecs = SPONSOR_LOGO_UPLOAD_SPECS;

  function handleCarouselFileChange(slot: CarouselSlot) {
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

  async function handleCarouselUpload(slot: CarouselSlot) {
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

  async function handleRemoveCarousel(slot: CarouselSlot) {
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

  function handleSponsorFileChange(slot: SponsorLogoSlot) {
    const input = sponsorInputRefs.current[slot];
    const file = input?.files?.[0];
    const check = checkSponsorLogoUploadFile(file);
    setSponsorFileChecks((prev) => ({ ...prev, [slot]: check }));

    if (!check.ok) {
      setSponsorStatus({
        phase: "error",
        message: check.message,
      });
      return;
    }

    if (sponsorStatus.phase === "error") {
      setSponsorStatus({ phase: "idle", message: "" });
    }
  }

  async function handleSponsorUpload(slot: SponsorLogoSlot) {
    if (sponsorLocked) return;

    const input = sponsorInputRefs.current[slot];
    const file = input?.files?.[0];
    const check = checkSponsorLogoUploadFile(file);
    setSponsorFileChecks((prev) => ({ ...prev, [slot]: check }));

    if (!check.ok) {
      setSponsorStatus({ phase: "error", message: check.message });
      return;
    }

    setSponsorBusySlot(slot);
    setSponsorStatus({
      phase: "uploading",
      message: `Uploading partner logo ${slot}… Other branding uploads are locked until this finishes.`,
    });
    setMessage("");

    const fd = new FormData();
    fd.set("slot", String(slot));
    fd.set("file", file!);

    try {
      const result = await postSponsorLogoUpload(fd);
      setBranding((b) => applySponsorLogos(b, result.sponsor_logos));
      setSponsorLoadErrors((prev) => ({ ...prev, [slot]: false }));
      setSponsorStatus({
        phase: "success",
        message: `Partner logo ${slot} uploaded. Home page updated.`,
      });
      setMessage(`Partner logo ${slot} live on home.`);
      if (input) input.value = "";
      setSponsorFileChecks((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    } catch (err) {
      const text = formatUploadError(err);
      setSponsorStatus({ phase: "error", message: text });
      setMessage(text);
    } finally {
      setSponsorBusySlot(null);
    }
  }

  async function handleRemoveSponsor(slot: SponsorLogoSlot) {
    if (sponsorLocked) return;

    setSponsorBusySlot(slot);
    setSponsorStatus({
      phase: "removing",
      message: `Removing partner logo ${slot}…`,
    });
    setMessage("");

    try {
      const result = await deleteSponsorLogoSlot(slot);
      setBranding((b) => applySponsorLogos(b, result.sponsor_logos));
      setSponsorStatus({
        phase: "success",
        message: `Partner logo ${slot} removed.`,
      });
      setMessage(`Partner logo ${slot} removed.`);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Remove failed";
      setSponsorStatus({ phase: "error", message: text });
      setMessage(text);
    } finally {
      setSponsorBusySlot(null);
    }
  }

  async function handleLogoUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sponsorLocked) return;

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
    if (sponsorLocked) return;
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
    if (sponsorLocked) return;
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
        Page backgrounds use the built-in animated gradient mesh. Upload partner logos
        (above Live ranks), the hero logo, and up to {CAROUSEL_SLOT_COUNT} home carousel
        photos. Only one file upload runs at a time.
      </p>

      <section className="sd-neon-panel space-y-4 p-6">
        <h2 className="font-semibold text-sd-glow">Partner logos (above Live ranks)</h2>
        <p className="text-sm text-sd-muted">
          Up to 3 company logos in a continuous marquee above Live ranks. Export every
          logo at the same size —{" "}
          <strong className="font-medium text-emerald-100/90">
            {sponsorSpecs.recommendedLabel}
          </strong>{" "}
          — so they align evenly in the strip. {sponsorSpecs.maxSizeLabel} · PNG or SVG
          with a transparent background.
        </p>

        <CarouselStatusBanner status={sponsorStatus} />

        <div className="max-w-md">
          <p className="mb-2 text-xs uppercase tracking-wider text-sd-muted/70">
            Home strip preview ({activeSponsorLogos.length} of 3 filled)
          </p>
          {activeSponsorLogos.length > 0 ? (
            <HomeSponsorLogoCarousel logos={activeSponsorLogos} />
          ) : (
            <div className="sd-inset flex h-20 items-center justify-center rounded-xl px-4 text-center text-sm text-sd-muted">
              {sponsorBusySlot
                ? "Preview will update when the current upload finishes…"
                : "Upload at least one partner logo to see the home strip."}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {SPONSOR_LOGO_SLOTS.map((slot) => {
            const url = branding.sponsor_logos[slot - 1];
            const isThisSlotBusy = sponsorBusySlot === slot;
            const fileCheck = sponsorFileChecks[slot];
            const uploadBlocked =
              sponsorLocked || (fileCheck !== undefined && !fileCheck.ok);
            return (
              <div
                key={slot}
                className={`sd-inset space-y-3 rounded-xl p-4 transition ${
                  isThisSlotBusy ? "ring-2 ring-sd-glow/50" : ""
                }`}
              >
                <p className="text-sm font-medium text-white">
                  Logo {slot}
                  {isThisSlotBusy && (
                    <span className="ml-2 text-xs font-normal text-sd-glow">
                      Working…
                    </span>
                  )}
                </p>
                {url ? (
                  <div className="space-y-2">
                    <div className="flex h-16 items-center justify-center rounded-lg bg-sd-deep px-3">
                      <img
                        src={url}
                        alt={`Partner logo slot ${slot}`}
                        className="max-h-12 max-w-full object-contain"
                        onLoad={() =>
                          setSponsorLoadErrors((prev) => ({
                            ...prev,
                            [slot]: false,
                          }))
                        }
                        onError={() =>
                          setSponsorLoadErrors((prev) => ({ ...prev, [slot]: true }))
                        }
                      />
                    </div>
                    {sponsorLoadErrors[slot] && (
                      <p className="text-xs text-amber-200/90">
                        This logo link is broken. Remove and upload again.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[6.5rem] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-emerald-500/25 bg-sd-deep/40 px-3 py-3 text-center">
                    <span className="text-xs font-semibold tabular-nums text-sd-glow">
                      {sponsorSpecs.recommendedLabel}
                    </span>
                    <span className="text-[10px] text-sd-muted/75">
                      {sponsorSpecs.recommendedAspect} aspect · same height per logo
                    </span>
                    <span className="mt-0.5 text-xs font-medium text-sd-muted/90">
                      No logo yet
                    </span>
                    {sponsorSpecs.emptyPlaceholderLines.slice(1).map((line) => (
                      <span
                        key={line}
                        className="text-[10px] leading-snug text-sd-muted/65"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  <input
                    ref={(el) => {
                      sponsorInputRefs.current[slot] = el;
                    }}
                    type="file"
                    accept={sponsorSpecs.accept}
                    disabled={sponsorLocked}
                    className="block w-full text-xs text-sd-muted disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={() => handleSponsorFileChange(slot)}
                  />
                  <FilePickNotice check={fileCheck} />
                  <button
                    type="button"
                    disabled={uploadBlocked}
                    aria-busy={isThisSlotBusy}
                    onClick={() => handleSponsorUpload(slot)}
                    className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isThisSlotBusy
                        ? "cursor-wait bg-gradient-to-r from-sd-lime to-emerald-400 text-sd-deep ring-2 ring-emerald-300/50"
                        : "sd-btn-primary"
                    }`}
                  >
                    {isThisSlotBusy
                      ? "Uploading…"
                      : url
                        ? "Replace logo"
                        : "Upload logo"}
                  </button>
                </div>
                {url && (
                  <button
                    type="button"
                    disabled={sponsorLocked}
                    onClick={() => handleRemoveSponsor(slot)}
                    className="text-xs text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove logo {slot}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAROUSEL_SLOTS.map((slot) => {
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
          disabled={logoBusy || sponsorLocked}
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
            disabled={logoBusy || sponsorLocked}
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
          disabled={logoBusy || sponsorLocked}
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
