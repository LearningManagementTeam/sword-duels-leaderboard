---
name: sword-duels-neon-glass
description: >-
  Applies Sword Duels Leaderboard neon glassmorphism UI — dark forest base,
  lime/emerald glow, magenta/purple complements, sd-* CSS primitives, HeroLogo,
  SdCarousel, ArBackdrop HUD, and gamified leaderboard components. Use when
  styling this repo, editing globals.css, glassmorphism, gamified HUD UI, hero
  logo, carousels, leaderboard components, admin branding preview, or Tailwind
  theme tokens for Sword Duels.
---

# Sword Duels Neon Glass UI

## Visual identity

- **Base:** `#041a12` (deep forest), panels `#0f3d2a` / `#14532d`
- **Primary glow (left):** emerald `#4ade80`, `#34d399`, muted `#86efac`
- **Lime CTAs:** `#a3e635`, `#bef264`
- **Complement (right):** magenta `#d946ef`, `#e879f9`, purple `#a855f7`
- **Gold:** `#fbbf24` — podium #1, champion badges
- **Adaptation:** Reference glassmorphism uses cyan+magenta; this project uses **green left + magenta right**

## CSS primitives (`src/app/globals.css`)

| Class | Use when |
|-------|----------|
| `.sd-glass` | Default cards, nav pills, light panels |
| `.sd-glass-strong` | Leaderboard shell, major sections |
| `.sd-neon-panel` | Hero areas, banners, carousel shell — dual-tone neon border |
| `.sd-inset` | Inputs, sunken stat slots, carousel track |
| `.sd-neon-track` | Progress bars (PhaseJourneyBar) |
| `.sd-light-streak` | Decorative horizontal flares (backdrop) |
| `.sd-hud-scan` | Full-page scan line on `ArBackdrop` |
| `.sd-carousel-track` | Infinite scroll lane inside `SdCarousel` |
| `.sd-row-hover` | Leaderboard row hover lift |
| `.sd-cut-shimmer` | Cut-line banner accent |
| `.sd-input` | Admin form fields (extends `.sd-inset`) |
| `.sd-btn-primary` | Lime glow CTA |
| `.sd-btn-secondary` | Magenta accent button |
| `.sd-btn-ghost` | Green outline button |
| `.sd-btn-danger` | Destructive actions |
| `.sd-stat-card` | Dashboard stat tiles |
| `.sd-table` / `.sd-table-wrap` | Data tables |
| `.sd-alert-warning` | Preview/setup banners (amber semantic) |
| `.sd-alert-info` | Info callouts |
| `.sd-page-header` | Page title + subtitle |
| `.sd-link` | Text links (`text-sd-glow`) |

Respect `prefers-reduced-motion`: animations disabled in globals.

## Component map

| Area | Files |
|------|--------|
| Tokens / CSS | `src/app/globals.css` |
| Backdrop | `ArBackdrop` + `resolveBackdropUrl()` — custom upload from Admin → Branding, else `public/backgrounds/sd-wave-green.png` (blur + scrim via `.sd-backdrop-photo`) |
| Carousel | `src/components/ui/SdCarousel.tsx` |
| Hero logo | `src/components/branding/HeroLogo.tsx` |
| Leaderboard | `src/components/leaderboard/*`, `LeaderboardSection.tsx` |
| Status | `src/components/StatusBadge.tsx` |
| Journey | `src/components/PhaseJourneyBar.tsx` |
| Shell | `SiteHeader.tsx`, `PhaseNav.tsx` |
| Branding data | `getBranding()`, Admin → `/admin/branding` |

## Hero logo rules

- Data: `BrandingConfig.logo_url` only (no hardcoded game art)
- **HeroLogo:** nearly full mobile width, `object-contain`, max-height ~42vh / 280px mobile
- **SiteHeader:** small logo only
- **LeaderboardBanner:** subtitle/round line — no duplicate hero image
- Transparent PNG/SVG on dark glass works best

## Page background rules

- Data: `BrandingConfig.background_url`; fallback `DEFAULT_BACKDROP_PATH` in `src/lib/branding.ts`
- Specs: `BACKGROUND_UPLOAD_SPECS` (1920×1080 rec., 1280×720 min, landscape aspect, 5MB, JPG/PNG/WebP)
- Client check: `validateBackgroundFile()` before server action `uploadBrandingBackground`
- Display: `ArBackdrop` uses `.sd-backdrop-photo` blur + gradient scrim; preview via `BackgroundPreview`
- Storage: `branding` bucket `background.{ext}`; remove logo/background independently (`logo.` / `background.` prefix)

## Carousel rules (`SdCarousel`)

- CSS infinite scroll; duplicate children for seamless loop
- Pause on hover; static/snap when `prefers-reduced-motion`
- Items: neon-bordered pills inside `.sd-neon-panel` + `.sd-inset` track
- Decorative: `aria-live="off"`

## Do / Don't

**Do:** Reuse `sd-*` classes; one `backdrop-filter` layer per card; CSS animations over new libs; update this skill when adding primitives.

**Don't:** White opaque pills on dark leaderboard; stack multiple blurs per row; change scoring/tie-breaker logic in UI-only tasks; add Swiper/Embla unless requested; add new `bg-slate-*` / `text-amber-*` for chrome (amber only inside `.sd-alert-warning`).

**Wrappers:** [`SdButton.tsx`](src/components/ui/SdButton.tsx), [`SdCard.tsx`](src/components/ui/SdCard.tsx), [`SdDataTable.tsx`](src/components/ui/SdDataTable.tsx), [`AdminNav.tsx`](src/components/admin/AdminNav.tsx) for active admin tabs.

## Tie breaker styling

Use **magenta/fuchsia** ring and badge pulse (`StatusBadge`, `GamifiedRankList`) — not cyan — for palette coherence.
