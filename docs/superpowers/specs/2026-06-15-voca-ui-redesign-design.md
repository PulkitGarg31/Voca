# VOCA UI/UX Redesign — Design Spec

**Date:** 2026-06-15
**Status:** Approved (pending spec review)
**Source of truth for visuals:** `Frontend Design.webp` (1024×4349 marketing landing mockup, "Linguist // AI")

## 1. Goal

Adopt the visual language of the `Frontend Design.webp` mockup across the entire VOCA app, and add the marketing landing page the mockup depicts. The product keeps the **VOCA** brand; the mockup's "Linguist // AI" name/copy is treated as placeholder.

### Decisions (locked)

- **Scope:** Build the new marketing landing page **and** restyle the whole existing app (auth + dashboard).
- **Theme:** Replace the global theme tokens (no per-page bespoke palettes).
- **Dark mode:** Keep the light/dark toggle; design a matching dark variant of the new theme.
- **Branding:** Keep **VOCA**. Adapt mockup copy to VOCA's real vocabulary-learning value prop.
- **Imagery:** CSS gradients + SVG clouds + CSS/real-component device frames. No stock photos / external image assets.

### Non-goals

- No backend, API route, auth, data-model, or hook changes.
- No billing/payments. The pricing section is **presentational only**.
- No new product features. This is a visual redesign; all existing logic stays intact.

## 2. Approach

**Token-swap + component-class refresh, then targeted per-page polish.** The app is built on semantic CSS-variable tokens (`bg`, `surface`, `ink`, `accent`, …) exposed to Tailwind, plus shared component classes (`.btn-primary`, `.input`, `.panel`, `.stat-card`, `.nav-item`, `.badge`, `.section-label`, `.display`, `.page-title`). Rewriting the token values + component classes + fonts re-skins most of the dashboard automatically; remaining work is hand-polish of high-visibility surfaces and the brand-new landing page.

## 3. Design system

### 3.1 Color tokens (`app/globals.css`)

Replace both `:root` (light) and `.dark` token sets. Values are RGB channel triplets (to keep the `rgb(var(--x) / <alpha-value>)` Tailwind setup).

**Light:**
- `--bg` near-white page `#F5F6F8`
- `--surface` white cards `#FFFFFF`
- `--surface-2` inner panels `#F1F4F9`
- `--line` / `--line-strong` cool light-gray borders
- `--ink` dark navy text `#0F1B2D`
- `--muted` / `--faint` slate-grays
- `--ghost` / `--ghost-hover` light-gray pill backgrounds
- `--accent` vivid blue `#2563EB`; `--accent-hover` `#1D4FD7`
- `--cell-0` empty heatmap cell (cool light gray)

**Dark:**
- `--bg` deep navy `#0B1220`
- `--surface` slate `#141C2B`
- `--surface-2` `#1B2536`
- `--ink` near-white `#E8EEF6`
- `--accent` brightened blue `#3B82F6`
- sky bands → night-sky gradient
- remaining tokens are dark-mode counterparts of the light set

**New tokens for the brand/sky system (both modes):**
- `--brand-navy` stable dark-navy used for primary pill buttons in light mode (so it doesn't invert with `--ink` in dark mode); in dark mode the primary pill falls back to the blue accent.
- `--sky-from` / `--sky-to` for the hero/CTA gradient bands.

### 3.2 Typography

- **Remove Bebas Neue.** Headings use **Inter** (already wired as `var(--font-inter)`) at bold weight, **normal case**, slight negative letter-spacing.
- Body stays a clean sans (Inter primary; DM Sans acceptable fallback). Update the Google Fonts `@import` and `tailwind.config.js` `fontFamily` so `display` no longer maps to Bebas Neue.
- Update `globals.css` base rule (`h1,h2,h3,.display`) and helpers `.display`, `.display-muted`, `.page-title`, `.section-label` to the Inter-bold treatment. Add a **two-tone heading** helper (ink first line + `text-accent` second line) used by section headers and the hero.
- Confirm Inter is loaded via `next/font` in `app/layout.jsx`; wire it if it is referenced but not actually loaded.

### 3.3 Component classes (`globals.css` `@layer components`)

- `.btn-primary` → **dark navy pill** (`--brand-navy` bg, white text, rounded-full); dark mode uses accent blue. Optional trailing arrow handled at call sites.
- `.btn-accent` (**new**) → blue pill.
- `.btn-ghost` → light-gray pill (refresh colors only).
- `.input` → blue focus ring (`focus:ring-accent`).
- Card classes (`.panel`, `.stat-card`, `.word-card`) → white surface, `rounded-2xl`/`rounded-3xl`, soft shadow, cool border.
- `.nav-item` / `.nav-item.active` → refreshed (active = navy or accent).
- `.badge`, `.section-label` → refreshed.
- `.checklist-row` (**new**) → blue check-circle icon + label, used by landing comparison/journey/pricing and reusable elsewhere.
- `.sky-band` (**new**) → reusable sky-gradient + SVG-cloud background wrapper for hero/CTA.

## 4. Marketing landing page

`app/page.jsx` currently redirects (`session ? /statistics : /login`). Change it to render the **public landing page** for everyone. The page reads the session server-side to swap the primary CTA: logged-in → "Go to dashboard" (`/statistics`); logged-out → "Start free" (`/register`) + "Sign in" (`/login`). Middleware already only gates `(dashboard)` paths, so `/` is public without middleware changes.

Landing components live under `components/landing/`. Sections (top→bottom), matching the mockup:

1. **MarketingHeader** — transparent over the sky hero; VOCA logo, anchor nav (Features / How it works / Pricing), Sign in + Start free. Sticky/condensed on scroll optional.
2. **Hero** (`.sky-band`) — two-tone headline, sub-copy, two CTAs, CSS/real-component **device preview** + floating feature chips.
3. **LogoCloud** — "Trusted by learners" + muted wordmark row (placeholder names).
4. **Features** — eyebrow + two-tone heading + **6 cards** (icon, title, desc, "Learn more →"). Cards map to VOCA features: AI vocabulary chat, spaced-repetition engine, smart word help/mnemonics, practice modes (flashcards/quiz/spelling), progress & streaks, multi-source word lookup.
5. **Comparison** (blue band) — "The old way vs. the VOCA way": two cards, red-X rows vs blue-check rows (rote memorization vs VOCA's adaptive SRS + AI).
6. **Journey** — eyebrow + two-tone heading + a **dashboard preview card** (daily streak, mastery/level, weekly-XP bar chart built in CSS) + a checklist (spaced repetition, mastery tracking, AI-guided practice).
7. **Pricing** — eyebrow + heading + **Monthly/Yearly toggle** (client state, presentational) + 3 plan cards (Starter / Pro [highlighted] / Team). Copy adapted to VOCA; **no checkout** — CTAs link to `/register`.
8. **CTA** (`.sky-band`) — closing headline + CTA + device mockup.
9. **Footer** — logo, tagline, Product/Company columns, contact placeholders, social links.

Landing is responsive (single-column stack on mobile) and dark-mode aware (sky → night sky).

## 5. App surfaces to hand-polish (after token swap)

Visual-only; no logic changes:

- **Navbar** (`components/Navbar.jsx`) — floating pill → white/blue; navy or accent active state; VOCA mark recolored.
- **Auth** — `app/(auth)/login/page.jsx`, `register/page.jsx`: clean light card with blue accents; headings switch to Inter normal-case.
- **Statistics** — `app/(dashboard)/statistics/page.jsx` + `components/stats/StreakHeatmap.jsx`, `CategoryBreakdown.jsx`, `RecentActivity.jsx`: recolor cells/bars/accents to the blue ramp.
- **Words** — `app/(dashboard)/words/page.jsx`, `components/words/WordCard.jsx`, `AddWordModal.jsx`, `BulkImportModal.jsx`.
- **Practice** — `app/(dashboard)/practice/page.jsx`.
- **Chat** — `app/(dashboard)/chat/page.jsx`, `components/FormattedText.jsx` (bubble/format colors only; **never** `dangerouslySetInnerHTML`).
- **Settings** — `app/(dashboard)/settings/page.jsx`.
- **Shared** — `components/WordOfDay.jsx`, `components/Feedback.jsx`, `components/ThemeToggle.jsx`.

## 6. Architecture / componentization

- New folder `components/landing/` — one file per section + small shared primitives (`SectionLabel`, `FeatureCard`, `PlanCard`, `CheckRow`, `DevicePreview`, `SkyBand`). Each is a focused, independently understandable unit; client components only where interactivity is needed (header scroll, pricing toggle, mobile menu).
- No new dependencies. Icons via inline SVG (matching the existing codebase convention).
- Reuse existing semantic tokens/utility classes throughout the landing page so it stays theme-consistent and dark-mode correct.

## 7. Verification (definition of done)

Per `CLAUDE.md`, there is no test framework; the bar is **clean `npm run lint` + `npm run build`**. Additionally:

- `npm run build` passes (the primary type/compile check).
- `npm run lint` clean.
- Manual visual pass: landing page in light + dark, logged-in vs logged-out CTA swap; each dashboard page + auth pages render with the new theme in both modes with no leftover orange/beige or Bebas Neue.
- No `dangerouslySetInnerHTML`; AI/user content still rendered via `FormattedText`.

## 8. Risks / notes

- **Primary-button color vs dark mode:** primary pills are dark navy in light mode; must not invert to light in dark mode — handled via the dedicated `--brand-navy` token (falls back to accent in dark).
- **Font swap blast radius:** removing Bebas Neue changes every heading from condensed-caps to Inter normal-case; intended, but visible everywhere — verify no layout breaks where `.page-title` (6rem) was used.
- **Leftover hardcoded colors:** a few files use raw palette colors (e.g. emerald success states). Audit during polish; keep semantic success/error but align hues.
