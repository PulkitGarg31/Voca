# VOCA UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the entire VOCA app to the `Frontend Design.webp` visual language (sky-blue/white + vivid-blue accent, Inter typography) and add the marketing landing page the mockup depicts, keeping the VOCA brand and all existing logic intact.

**Architecture:** Token-swap first — rewrite the semantic CSS-variable tokens, component classes, and fonts so the dashboard re-skins automatically; then build a new public landing page at `/` from focused components under `components/landing/`; then hand-polish the few surfaces with hardcoded colors/heading copy.

**Tech Stack:** Next.js 14 App Router, JavaScript (`.jsx`), Tailwind CSS with semantic CSS-variable tokens, `next/font` Inter, NextAuth (read-only here). No new dependencies.

> **Testing note:** This project has **no test framework** (see `CLAUDE.md`). The verification bar is a clean **`npm run lint`** + **`npm run build`** (build is the primary type/compile check), plus a described manual visual check. Each task's "verify" steps reflect that instead of unit tests. `npm run build` is slow (~1–2 min); run `npm run lint` after small tasks and `npm run build` at the task boundaries indicated.

---

## File Structure

**Modify (foundation):**
- `app/globals.css` — theme tokens (light+dark), base typography, `@layer components` classes
- `tailwind.config.js` — `fontFamily` (Inter), new `brand-navy` colors
- `app/page.jsx` — becomes the public landing page (was a redirect)

**Create (landing):**
- `components/landing/Icons.jsx` — inline SVG icon set
- `components/landing/primitives.jsx` — `SectionLabel`, `SkyBand`, `FeatureCard`, `CheckRow`, `PlanCard`
- `components/landing/DevicePreview.jsx` — CSS phone/dashboard mockup
- `components/landing/MarketingHeader.jsx` — top nav (client: mobile menu + scroll state)
- `components/landing/Hero.jsx`
- `components/landing/LogoCloud.jsx`
- `components/landing/Features.jsx`
- `components/landing/Comparison.jsx`
- `components/landing/Journey.jsx`
- `components/landing/Pricing.jsx` — (client: monthly/yearly toggle)
- `components/landing/CTA.jsx`
- `components/landing/Footer.jsx`

**Modify (polish — visual only):**
- `components/Navbar.jsx`
- `app/(auth)/login/page.jsx`, `app/(auth)/register/page.jsx`
- `app/(dashboard)/statistics/page.jsx`, `components/stats/StreakHeatmap.jsx`, `components/stats/CategoryBreakdown.jsx`, `components/stats/RecentActivity.jsx`
- `app/(dashboard)/words/page.jsx`, `components/words/WordCard.jsx`, `components/words/AddWordModal.jsx`, `components/words/BulkImportModal.jsx`
- `app/(dashboard)/practice/page.jsx`
- `app/(dashboard)/chat/page.jsx`, `components/FormattedText.jsx`
- `app/(dashboard)/settings/page.jsx`
- `components/WordOfDay.jsx`, `components/Feedback.jsx`

---

## Task 1: Theme tokens + typography foundation

**Files:**
- Modify: `app/globals.css` (lines 5–54: `@import`, `:root`, `.dark`, `@layer base`)
- Modify: `tailwind.config.js` (`colors`, `fontFamily`)

- [ ] **Step 1: Replace the font import + token blocks in `app/globals.css`**

Replace lines 5–40 (the `@import url(...)` line through the end of the `.dark { ... }` block) with:

```css
/* Inter is loaded via next/font in app/layout.jsx (--font-inter); no @import needed. */

/* ─── Theme tokens (RGB channels) ───────────────────────────── */
:root {
  --bg: 245 247 250;            /* #F5F7FA page */
  --surface: 255 255 255;       /* #FFFFFF cards */
  --surface-2: 241 244 249;     /* #F1F4F9 inner panels */
  --line: 226 232 240;          /* #E2E8F0 borders */
  --line-strong: 203 213 225;   /* #CBD5E1 hover borders */
  --ink: 15 27 45;              /* #0F1B2D primary text / navy */
  --muted: 100 116 139;         /* #64748B secondary text */
  --faint: 148 163 184;         /* #94A3B8 tertiary text */
  --ghost: 241 244 249;         /* ghost/secondary button bg */
  --ghost-hover: 226 232 240;   /* ghost hover */
  --accent: 37 99 235;          /* #2563EB brand blue */
  --accent-hover: 29 78 216;    /* #1D4ED8 */
  --brand-navy: 15 27 45;       /* #0F1B2D primary pill button */
  --brand-navy-hover: 30 41 59; /* #1E293B */
  --sky-from: 219 234 254;      /* #DBEAFE hero gradient top */
  --sky-to: 245 247 250;        /* fades into page */
  --cell-0: 226 232 240;        /* empty heatmap cell */
  color-scheme: light;
}

.dark {
  --bg: 11 18 32;               /* #0B1220 */
  --surface: 20 28 43;          /* #141C2B */
  --surface-2: 27 37 54;        /* #1B2536 */
  --line: 39 51 73;             /* #273349 */
  --line-strong: 51 65 92;      /* #33415C */
  --ink: 232 238 246;           /* #E8EEF6 */
  --muted: 148 163 184;         /* #94A3B8 */
  --faint: 100 116 139;         /* #64748B */
  --ghost: 27 37 54;
  --ghost-hover: 39 51 73;
  --accent: 59 130 246;         /* #3B82F6 */
  --accent-hover: 96 165 250;   /* #60A5FA */
  --brand-navy: 59 130 246;     /* in dark, primary pill = accent blue */
  --brand-navy-hover: 96 165 250;
  --sky-from: 15 23 42;         /* #0F172A night sky */
  --sky-to: 11 18 32;           /* #0B1220 */
  --cell-0: 27 37 54;
  color-scheme: dark;
}
```

- [ ] **Step 2: Replace the `@layer base` block in `app/globals.css`**

Replace the existing `@layer base { ... }` (currently lines 42–54) with:

```css
@layer base {
  * { box-sizing: border-box; }
  body {
    background-color: rgb(var(--bg));
    color: rgb(var(--ink));
    font-family: var(--font-inter), "system-ui", sans-serif;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  h1, h2, h3 {
    font-weight: 700;
    letter-spacing: -0.02em;
  }
}
```

- [ ] **Step 3: Update `tailwind.config.js` colors + fonts**

In the `colors: { ... }` object, add these two entries (after `"accent-hover"`):

```js
        "brand-navy": "rgb(var(--brand-navy) / <alpha-value>)",
        "brand-navy-hover": "rgb(var(--brand-navy-hover) / <alpha-value>)",
```

Replace the `fontFamily` block with:

```js
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: build succeeds (Tailwind picks up new tokens; pages now render in blue theme though some headings/heatmap still need polish).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tailwind.config.js
git commit -m "redesign: swap theme tokens to blue/sky palette + Inter typography"
```

---

## Task 2: Refresh component classes

**Files:**
- Modify: `app/globals.css` (`@layer components` block, currently lines 56–96)

- [ ] **Step 1: Replace the entire `@layer components { ... }` block**

```css
@layer components {
  .btn-primary {
    @apply bg-brand-navy hover:bg-brand-navy-hover active:scale-95 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed;
  }
  .btn-accent {
    @apply bg-accent hover:bg-accent-hover active:scale-95 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed;
  }
  .btn-ghost {
    @apply bg-ghost hover:bg-ghost-hover text-ink text-sm font-semibold px-6 py-3 rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed;
  }
  .input {
    @apply w-full border border-line bg-surface text-ink rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all placeholder:text-faint;
  }
  .stat-card {
    @apply bg-surface border border-line rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-line-strong transition-all;
  }
  .word-card {
    @apply bg-surface border border-line rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-line-strong transition-all duration-150;
  }
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  .display { @apply font-display font-bold tracking-tight text-ink; }
  .display-muted { color: rgb(var(--faint)); }
  .page-title {
    @apply font-display font-extrabold text-5xl md:text-6xl leading-tight tracking-tight text-ink;
  }
  .section-label {
    @apply inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] text-accent uppercase;
  }
  .panel {
    @apply bg-surface border border-line rounded-2xl shadow-sm;
  }
  .checklist-row {
    @apply flex items-center gap-3 text-sm text-ink;
  }
  .nav-item {
    @apply flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-ink hover:bg-surface-2 transition-colors;
  }
  .nav-item.active {
    @apply bg-ink text-white;
  }
  .scrollbar-thin::-webkit-scrollbar { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: rgb(var(--line)); border-radius: 99px; }
}
```

> Note: `.page-title` changed from a fixed `6rem` Bebas size to a responsive Inter `text-5xl md:text-6xl`. `.section-label` is now blue + has a flex gap for an optional leading icon. Callers that pass an icon child get spacing for free; text-only callers are unaffected.

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "redesign: refresh component classes (buttons, cards, labels, checklist)"
```

---

## Task 3: Landing icons

**Files:**
- Create: `components/landing/Icons.jsx`

- [ ] **Step 1: Create `components/landing/Icons.jsx`**

```jsx
// Inline SVG icons for the landing page. All inherit `currentColor` and take a
// className so callers control size/color via Tailwind (matches the codebase
// convention of hand-rolled SVGs rather than an icon dependency).
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export const ArrowRight = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Check = (p) => (
  <svg {...base} {...p}><path d="M20 6 9 17l-5-5" /></svg>
);
export const X = (p) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const Sparkle = (p) => (
  <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></svg>
);
export const Chat = (p) => (
  <svg {...base} {...p}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.4 8.4 0 0 1-.9-3.9A8.5 8.5 0 0 1 21 11.5Z" /></svg>
);
export const Repeat = (p) => (
  <svg {...base} {...p}><path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" /></svg>
);
export const Bulb = (p) => (
  <svg {...base} {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" /></svg>
);
export const Cards = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="14" height="14" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v11" /></svg>
);
export const Chart = (p) => (
  <svg {...base} {...p}><path d="M3 3v18h18M8 16v-5M13 16V8M18 16v-9" /></svg>
);
export const Search = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const Flame = (p) => (
  <svg {...base} {...p}><path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 0-2-1-3 3 1 5 4 5 7a6 6 0 0 1-12 0c0-4 4-5 6-11Z" /></svg>
);
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/Icons.jsx
git commit -m "redesign: add landing page icon set"
```

---

## Task 4: Landing primitives

**Files:**
- Create: `components/landing/primitives.jsx`

- [ ] **Step 1: Create `components/landing/primitives.jsx`**

```jsx
import { Check, ArrowRight } from "@/components/landing/Icons";

// Sky-gradient band used by Hero and CTA. Gradient + faint cloud blobs are
// driven by theme tokens so dark mode becomes a night sky automatically.
export function SkyBand({ children, className = "" }) {
  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{
        background:
          "linear-gradient(180deg, rgb(var(--sky-from)) 0%, rgb(var(--sky-to)) 100%)",
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-10 left-1/4 h-48 w-48 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
        <div className="absolute top-20 right-1/4 h-56 w-56 rounded-full bg-white/30 blur-3xl dark:bg-white/5" />
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

// Eyebrow label: blue uppercase text with an optional leading icon.
export function SectionLabel({ icon: Icon, children }) {
  return (
    <span className="section-label">
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

// Two-tone heading: first line in ink, second line in accent blue.
export function TwoToneHeading({ top, accent, className = "" }) {
  return (
    <h2 className={`font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink ${className}`}>
      {top} <br className="hidden sm:block" />
      <span className="text-accent">{accent}</span>
    </h2>
  );
}

export function FeatureCard({ icon: Icon, title, children }) {
  return (
    <div className="panel p-6 flex flex-col gap-4 hover:shadow-md hover:border-line-strong transition-all">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="text-sm text-muted leading-relaxed flex-1">{children}</p>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        Learn more <ArrowRight className="h-4 w-4" />
      </span>
    </div>
  );
}

// A single row in a comparison/feature checklist. `negative` renders a red X.
export function CheckRow({ children, negative = false }) {
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-line/70 last:border-0 text-sm">
      <span
        className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
          negative ? "bg-red-500/10 text-red-500" : "bg-accent/10 text-accent"
        }`}
      >
        {negative ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      </span>
      <span className={negative ? "text-muted" : "text-ink"}>{children}</span>
    </li>
  );
}

export function PlanCard({ name, tagline, price, period, features, cta, href, highlighted = false }) {
  return (
    <div
      className={`rounded-3xl p-7 flex flex-col gap-6 border transition-all ${
        highlighted
          ? "bg-ink text-white border-ink shadow-lg scale-[1.02]"
          : "bg-surface border-line shadow-sm"
      }`}
    >
      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest ${highlighted ? "text-white/60" : "text-muted"}`}>
          {name}
        </p>
        <h3 className={`mt-1 text-xl font-bold ${highlighted ? "text-white" : "text-accent"}`}>{tagline}</h3>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-4xl font-extrabold ${highlighted ? "text-white" : "text-ink"}`}>{price}</span>
        <span className={`mb-1 text-sm ${highlighted ? "text-white/60" : "text-muted"}`}>{period}</span>
      </div>
      <a
        href={href}
        className={`text-center text-sm font-semibold px-6 py-3 rounded-full transition-all ${
          highlighted ? "bg-white text-ink hover:bg-white/90" : "btn-ghost"
        }`}
      >
        {cta}
      </a>
      <ul className="flex flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm">
            <Check className={`h-4 w-4 flex-shrink-0 ${highlighted ? "text-white" : "text-accent"}`} />
            <span className={highlighted ? "text-white/90" : "text-ink"}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

> `CheckRow` references `X` — add it to the import line: `import { Check, ArrowRight, X } from "@/components/landing/Icons";`

- [ ] **Step 2: Fix the import line to include `X`**

Make the first line of the file:

```jsx
import { Check, ArrowRight, X } from "@/components/landing/Icons";
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/primitives.jsx
git commit -m "redesign: add landing primitives (SkyBand, cards, rows, headings)"
```

---

## Task 5: Device preview mockup

**Files:**
- Create: `components/landing/DevicePreview.jsx`

- [ ] **Step 1: Create `components/landing/DevicePreview.jsx`**

```jsx
import { Flame } from "@/components/landing/Icons";

// Pure-CSS phone frame showing a simplified VOCA dashboard. No image assets.
export default function DevicePreview() {
  const bars = [40, 65, 50, 90, 70, 55, 80];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="relative mx-auto w-[260px]">
      <div className="rounded-[2.5rem] border-[6px] border-ink/90 bg-surface shadow-2xl overflow-hidden">
        <div className="bg-surface px-4 pt-5 pb-6 space-y-4">
          {/* header */}
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-extrabold tracking-tight text-ink">VOCA</span>
            <span className="h-7 w-7 rounded-full bg-accent/15" />
          </div>
          {/* streak */}
          <div className="rounded-2xl bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-accent">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-semibold">Daily streak</span>
            </div>
            <p className="mt-1 text-2xl font-extrabold text-ink">12 days</p>
          </div>
          {/* mini chart */}
          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold text-muted mb-3">Words this week</p>
            <div className="flex items-end justify-between gap-1.5 h-20">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-md ${i === 3 ? "bg-accent" : "bg-accent/25"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-faint">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* word row */}
          <div className="rounded-2xl border border-line p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink">eloquent</p>
              <p className="text-[10px] text-muted">fluent & persuasive</p>
            </div>
            <span className="badge bg-accent/10 text-accent">Lv 4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/landing/DevicePreview.jsx
git commit -m "redesign: add CSS device-preview mockup"
```

---

## Task 6: Marketing header + Hero

**Files:**
- Create: `components/landing/MarketingHeader.jsx`, `components/landing/Hero.jsx`

- [ ] **Step 1: Create `components/landing/MarketingHeader.jsx`**

```jsx
"use client";
import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#journey" },
  { label: "Pricing", href: "#pricing" },
];

export default function MarketingHeader({ loggedIn }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted hover:text-ink transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <Link href="/statistics" className="btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-ink hover:text-accent transition-colors">Sign in</Link>
              <Link href="/register" className="btn-primary">Start free</Link>
            </>
          )}
        </div>

        <button onClick={() => setOpen((v) => !v)} className="md:hidden btn-ghost px-4 py-2">Menu</button>
      </div>

      {open && (
        <div className="md:hidden mx-4 panel p-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="nav-item">{l.label}</a>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            {loggedIn ? (
              <Link href="/statistics" className="btn-primary text-center">Go to dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-center">Sign in</Link>
                <Link href="/register" className="btn-primary text-center">Start free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Create `components/landing/Hero.jsx`**

```jsx
import Link from "next/link";
import { SkyBand } from "@/components/landing/primitives";
import { ArrowRight, Sparkle } from "@/components/landing/Icons";
import DevicePreview from "@/components/landing/DevicePreview";

export default function Hero({ loggedIn }) {
  return (
    <SkyBand className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-accent backdrop-blur">
          <Sparkle className="h-3.5 w-3.5" /> AI-powered vocabulary learning
        </span>
        <h1 className="mt-6 font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-ink">
          Build a vocabulary <br className="hidden sm:block" />
          that <span className="text-accent">finally sticks</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-muted">
          VOCA blends AI conversations, spaced repetition, and smart practice so you
          learn new words 10× faster — and actually remember them.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <Link href="/statistics" className="btn-primary inline-flex items-center gap-2">
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="btn-ghost">See how it works</a>
            </>
          )}
        </div>
        <div className="mt-14 flex justify-center">
          <DevicePreview />
        </div>
      </div>
    </SkyBand>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/MarketingHeader.jsx components/landing/Hero.jsx
git commit -m "redesign: add landing header + hero"
```

---

## Task 7: LogoCloud + Features

**Files:**
- Create: `components/landing/LogoCloud.jsx`, `components/landing/Features.jsx`

- [ ] **Step 1: Create `components/landing/LogoCloud.jsx`**

```jsx
const NAMES = ["Lexica", "ByteBoost", "Hexagon", "Codelink", "Netdot", "Wordly"];

export default function LogoCloud() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-faint">
          Trusted by curious learners everywhere
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {NAMES.map((n) => (
            <span key={n} className="font-display text-lg font-bold tracking-tight text-faint/80">{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/landing/Features.jsx`**

```jsx
import { SectionLabel, TwoToneHeading, FeatureCard } from "@/components/landing/primitives";
import { Sparkle, Chat, Repeat, Bulb, Cards, Chart, Search } from "@/components/landing/Icons";

const FEATURES = [
  { icon: Chat, title: "AI vocabulary chat", body: "Chat with an AI tutor that explains words, quizzes you, and uses them in real context." },
  { icon: Repeat, title: "Spaced repetition engine", body: "A Leitner-style scheduler resurfaces each word right before you'd forget it." },
  { icon: Bulb, title: "Smart word help", body: "Instant examples, mnemonics, and usage tips generated for every word you save." },
  { icon: Cards, title: "Practice your way", body: "Flashcards, multiple-choice quizzes, and spelling drills to lock words in." },
  { icon: Chart, title: "Progress & streaks", body: "Track mastery levels, daily streaks, and exactly what's due for review." },
  { icon: Search, title: "One-tap lookups", body: "Add words from built-in dictionary lookups or bulk-import a whole list." },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <div className="max-w-2xl">
        <SectionLabel icon={Sparkle}>AI powered features</SectionLabel>
        <TwoToneHeading className="mt-4" top="Everything you need to" accent="become truly fluent" />
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title}>{f.body}</FeatureCard>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/LogoCloud.jsx components/landing/Features.jsx
git commit -m "redesign: add landing logo cloud + features"
```

---

## Task 8: Comparison + Journey

**Files:**
- Create: `components/landing/Comparison.jsx`, `components/landing/Journey.jsx`

- [ ] **Step 1: Create `components/landing/Comparison.jsx`**

```jsx
import { CheckRow } from "@/components/landing/primitives";

const OLD = ["Static, one-size word lists", "Cram, then forget", "No feedback on usage", "Same path for everyone", "Manual, easy-to-skip review"];
const NEW = ["Adaptive spaced repetition", "Remember for the long term", "AI feedback, examples & mnemonics", "Personalized to your own words", "Reviews auto-scheduled, 24/7"];

export default function Comparison() {
  return (
    <section className="bg-accent text-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">The difference</span>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Rote memorization vs. <br className="hidden sm:block" /> the VOCA way
          </h2>
          <p className="mt-4 text-white/80 max-w-md">
            Traditional study is slow and forgettable. VOCA flips the script with AI and a scheduler built around how memory actually works.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-surface p-7">
            <h3 className="text-lg font-bold text-ink">The old way</h3>
            <ul className="mt-4">
              {OLD.map((t) => <CheckRow key={t} negative>{t}</CheckRow>)}
            </ul>
          </div>
          <div className="rounded-3xl bg-surface p-7 shadow-lg">
            <h3 className="text-lg font-bold text-accent">The VOCA way</h3>
            <ul className="mt-4">
              {NEW.map((t) => <CheckRow key={t}>{t}</CheckRow>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/landing/Journey.jsx`**

```jsx
import { SectionLabel, TwoToneHeading } from "@/components/landing/primitives";
import { Chart, Check, Flame } from "@/components/landing/Icons";

const POINTS = ["Spaced-repetition scheduling", "Mastery level tracking", "AI-guided practice sessions"];
const bars = [45, 70, 55, 95, 75, 60, 85];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Journey() {
  return (
    <section id="journey" className="mx-auto max-w-6xl px-4 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
      {/* preview card */}
      <div className="panel p-6 order-2 lg:order-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-accent text-xs font-semibold"><Flame className="h-4 w-4" /> Daily streak</div>
            <p className="mt-1 text-2xl font-extrabold text-ink">42 days</p>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold text-muted">Mastery</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">B2 <span className="text-sm font-medium text-muted">Upper-Int.</span></p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold text-muted mb-4">Words mastered this week</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full rounded-md ${i === 3 ? "bg-accent" : "bg-accent/25"}`} style={{ height: `${h}%` }} />
                <span className="text-[10px] text-faint">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* copy */}
      <div className="order-1 lg:order-2">
        <SectionLabel icon={Chart}>Progress you can see</SectionLabel>
        <TwoToneHeading className="mt-4" top="Visualize your journey" accent="to true fluency" />
        <p className="mt-4 text-muted max-w-md">
          Data-driven insights help you focus on what matters. Track vocabulary growth, mastery, and review accuracy over time.
        </p>
        <ul className="mt-6 space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="checklist-row">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Check className="h-3.5 w-3.5" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/Comparison.jsx components/landing/Journey.jsx
git commit -m "redesign: add landing comparison + journey sections"
```

---

## Task 9: Pricing + CTA + Footer

**Files:**
- Create: `components/landing/Pricing.jsx`, `components/landing/CTA.jsx`, `components/landing/Footer.jsx`

- [ ] **Step 1: Create `components/landing/Pricing.jsx`**

```jsx
"use client";
import { useState } from "react";
import { SectionLabel, PlanCard } from "@/components/landing/primitives";

const PLANS = (yearly) => [
  {
    name: "Starter", tagline: "Free forever", price: "$0", period: "/mo",
    cta: "Get started free", href: "/register",
    features: ["Up to 100 words", "Flashcards & quizzes", "Daily streak tracking", "Basic AI word help"],
  },
  {
    name: "Pro", tagline: "Pro learner", price: yearly ? "$7" : "$9", period: "/mo", highlighted: true,
    cta: "Start Pro free", href: "/register",
    features: ["Unlimited words", "Unlimited AI conversations", "Spaced-repetition engine", "Mnemonics & examples", "Full progress analytics"],
  },
  {
    name: "Team", tagline: "Team & power", price: yearly ? "$15" : "$19", period: "/mo",
    cta: "Get Team", href: "/register",
    features: ["Everything in Pro", "Shared vocabulary packs", "Team dashboards", "Priority AI model", "Export & integrations"],
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink">
              Simple, transparent pricing <br className="hidden sm:block" />
              <span className="text-accent">for every learner</span>
            </h2>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-ink p-1 text-sm font-semibold">
            <button onClick={() => setYearly(false)} className={`px-4 py-2 rounded-full transition-colors ${!yearly ? "bg-white text-ink" : "text-white/70"}`}>Monthly</button>
            <button onClick={() => setYearly(true)} className={`px-4 py-2 rounded-full transition-colors ${yearly ? "bg-white text-ink" : "text-white/70"}`}>Yearly <span className="text-accent">-20%</span></button>
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-center">
          {PLANS(yearly).map((p) => <PlanCard key={p.name} {...p} />)}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/landing/CTA.jsx`**

```jsx
import Link from "next/link";
import { SkyBand } from "@/components/landing/primitives";
import { ArrowRight } from "@/components/landing/Icons";
import DevicePreview from "@/components/landing/DevicePreview";

export default function CTA({ loggedIn }) {
  return (
    <SkyBand className="py-20">
      <div className="mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink">
            Your first words start <br className="hidden sm:block" />
            <span className="text-accent">in under 60 seconds</span>
          </h2>
          <p className="mt-5 max-w-md text-muted">
            No setup, no credit card. Add a word, start a chat, and let VOCA handle the rest.
          </p>
          <div className="mt-8">
            <Link href={loggedIn ? "/statistics" : "/register"} className="btn-primary inline-flex items-center gap-2">
              {loggedIn ? "Go to dashboard" : "Start learning free"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="flex justify-center"><DevicePreview /></div>
      </div>
    </SkyBand>
  );
}
```

- [ ] **Step 3: Create `components/landing/Footer.jsx`**

```jsx
import Link from "next/link";

const PRODUCT = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "AI Chat", href: "/chat" },
  { label: "Practice", href: "/practice" },
];
const COMPANY = [
  { label: "Sign in", href: "/login" },
  { label: "Create account", href: "/register" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
          </div>
          <p className="mt-4 text-sm text-muted max-w-xs">
            Learn and remember words that actually stick — powered by AI and spaced repetition.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Product</p>
          <ul className="mt-4 space-y-2.5">
            {PRODUCT.map((l) => (
              <li key={l.label}><Link href={l.href} className="text-sm text-muted hover:text-ink transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Account</p>
          <ul className="mt-4 space-y-2.5">
            {COMPANY.map((l) => (
              <li key={l.label}><Link href={l.href} className="text-sm text-muted hover:text-ink transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-faint">Stay in touch</p>
          <p className="mt-4 text-sm text-muted">hello@voca.app</p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-faint">© 2026 VOCA. All rights reserved.</div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/landing/Pricing.jsx components/landing/CTA.jsx components/landing/Footer.jsx
git commit -m "redesign: add landing pricing, CTA, footer"
```

---

## Task 10: Wire the landing page into `/`

**Files:**
- Modify: `app/page.jsx` (replace the whole file)

- [ ] **Step 1: Replace `app/page.jsx`**

```jsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MarketingHeader from "@/components/landing/MarketingHeader";
import Hero from "@/components/landing/Hero";
import LogoCloud from "@/components/landing/LogoCloud";
import Features from "@/components/landing/Features";
import Comparison from "@/components/landing/Comparison";
import Journey from "@/components/landing/Journey";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const loggedIn = Boolean(session?.user?.id);
  return (
    <main className="relative">
      <MarketingHeader loggedIn={loggedIn} />
      <Hero loggedIn={loggedIn} />
      <LogoCloud />
      <Features />
      <Comparison />
      <Journey />
      <Pricing />
      <CTA loggedIn={loggedIn} />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 2: Verify build (full landing renders)**

Run: `npm run build`
Expected: build succeeds. (If a landing import path is wrong, build fails here — fix and re-run.)

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`, open `http://localhost:3000` logged-out. Confirm: hero sky gradient, header shows "Sign in / Start free", all 8 sections render, pricing toggle switches prices, dark mode (toggle `dark` class on `<html>` via devtools) turns sky into night sky. Then stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/page.jsx
git commit -m "redesign: serve marketing landing page at /"
```

---

## Task 11: Polish Navbar + auth pages

**Files:**
- Modify: `components/Navbar.jsx`, `app/(auth)/login/page.jsx`, `app/(auth)/register/page.jsx`

- [ ] **Step 1: Navbar — recolor the floating pill + logo**

In `components/Navbar.jsx`:
- Line 22: change the bar wrapper from `bg-ghost` to `bg-surface/80 backdrop-blur border border-line`. Result:
  ```jsx
  <div className="bg-surface/80 backdrop-blur border border-line rounded-full px-5 py-2.5 flex items-center justify-between shadow-sm">
  ```
- Line 25: change logo chip `rounded-full bg-accent` → `rounded-xl bg-accent` (square-ish to match landing).
- Line 30: change `font-display text-lg tracking-widest text-ink` → `font-display text-lg font-extrabold tracking-tight text-ink`.
- Line 34: nav container `bg-ghost-hover` → `bg-surface-2`.
- Line 65: mobile Menu button `bg-accent` → keep but switch to `btn-primary`-style; replace `className="md:hidden bg-accent text-white text-xs font-semibold px-4 py-2 rounded-full"` with `className="md:hidden bg-brand-navy text-white text-xs font-semibold px-4 py-2 rounded-full"`.

- [ ] **Step 2: Login — sentence-case heading + accent links**

In `app/(auth)/login/page.jsx`:
- Line 38: add a subtle sky tint to the page bg — change `bg-bg` to `bg-bg` and wrap is fine; leave as-is.
- Line 42: logo chip `rounded-full bg-accent` → `rounded-xl bg-accent`.
- Line 47: `font-display text-2xl tracking-[0.1em] text-ink` → `font-display text-2xl font-extrabold tracking-tight text-ink`.
- Line 49: replace the heading with sentence case + Inter sizing:
  ```jsx
  <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink">Welcome back</h1>
  ```

- [ ] **Step 3: Register — same treatment**

In `app/(auth)/register/page.jsx`:
- Line 42: `font-display text-2xl tracking-[0.1em] text-ink` → `font-display text-2xl font-extrabold tracking-tight text-ink`.
- Line 44: replace heading:
  ```jsx
  <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink">Create account</h1>
  ```
- Logo chip (the `rounded-full bg-accent` near line 41–43): change `rounded-full` → `rounded-xl`.

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/Navbar.jsx app/(auth)/login/page.jsx app/(auth)/register/page.jsx
git commit -m "redesign: polish navbar + auth pages"
```

---

## Task 12: Polish statistics + stats components

**Files:**
- Modify: `components/stats/StreakHeatmap.jsx`, `app/(dashboard)/statistics/page.jsx`, `components/stats/CategoryBreakdown.jsx`, `components/stats/RecentActivity.jsx`

- [ ] **Step 1: Recolor the heatmap ramp from orange → blue**

In `components/stats/StreakHeatmap.jsx`, replace the color helper + legend (lines ~7–15) with a blue ramp:

```jsx
// Blue intensity ramp — reads well on both light and dark surfaces.
function cellColor(count) {
  if (count <= 0) return "rgb(var(--cell-0))";
  if (count <= 2) return "#bfdbfe"; // blue-200
  if (count <= 5) return "#60a5fa"; // blue-400
  if (count <= 10) return "#2563eb"; // blue-600
  return "#1e3a8a"; // blue-900
}
const LEGEND = ["rgb(var(--cell-0))", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"];
```

> Keep the surrounding function/variable names exactly as they are in the file; only the literal hex values and the comment change. If the existing helper is named differently (e.g. an inline arrow), preserve its name and signature and only swap the returned hex strings.

- [ ] **Step 2: Heatmap big-number headings already use `text-accent` / `text-ink`** — no change needed; they now render in Inter automatically.

- [ ] **Step 3: Statistics page heading**

In `app/(dashboard)/statistics/page.jsx` line 81, the streak number uses `font-display text-[3rem] ... text-accent` with literal "DAYS" — this still works in Inter. Optionally soften: change `{overall.streak.current} DAYS` casing is fine. No required change; leave as-is unless it visually reads too large — if so change `text-[3rem]` to `text-5xl`.

- [ ] **Step 4: Skim `CategoryBreakdown.jsx` and `RecentActivity.jsx`**

Open each. They use semantic tokens (`text-accent`, `bg-surface`, etc.) per the audit (no hardcoded palette colors were found in them). Confirm no `#hex` or raw `orange-`/`amber-` remain. If any are found, map to: orange→accent, beige→surface. Likely **no edits needed**.

- [ ] **Step 5: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/stats/StreakHeatmap.jsx app/(dashboard)/statistics/page.jsx
git commit -m "redesign: blue heatmap ramp + statistics polish"
```

---

## Task 13: Polish words / practice / chat / settings + shared components

**Files:**
- Modify: `app/(dashboard)/words/page.jsx`, `app/(dashboard)/chat/page.jsx`, `app/(dashboard)/practice/page.jsx`, `components/WordOfDay.jsx`

> Audit result: `emerald` (success) and `red` (error/danger) usages in `Feedback.jsx`, `settings/page.jsx`, `practice/page.jsx`, `AddWordModal.jsx`, `BulkImportModal.jsx`, `WordCard.jsx`, `login/page.jsx` are **semantic** (success/error/danger) and stay. `amber` favorite-stars in `words/page.jsx` + `WordCard.jsx` are the conventional "gold star" and stay. The only changes here are literal-uppercase display headings that now read better in sentence case under Inter.

- [ ] **Step 1: Chat heading**

In `app/(dashboard)/chat/page.jsx` line 191, change:
```jsx
<h1 className="font-display text-[3.5rem] leading-none tracking-[0.05em] text-ink">VOCA AI</h1>
```
to:
```jsx
<h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink">VOCA AI</h1>
```

- [ ] **Step 2: Practice headings**

In `app/(dashboard)/practice/page.jsx`:
- Line 310: the big word `font-display text-[5rem] ... uppercase` — keep `uppercase` (intentional big word display) but ensure it reads as bold Inter: change `font-display text-[5rem] leading-none tracking-[0.03em] text-ink uppercase` → `font-display text-6xl font-extrabold leading-none tracking-tight text-ink uppercase`.
- Lines 269/274: score numbers `font-display text-[4rem]` → `font-display text-6xl font-extrabold`. Keep `text-accent` / `display-muted`.
- Line 246: `font-display text-2xl tracking-wide text-ink` → `font-display text-2xl font-bold tracking-tight text-ink`.

- [ ] **Step 3: WordOfDay heading**

In `components/WordOfDay.jsx` line 96, change:
```jsx
<h3 className="font-display text-[2.75rem] leading-none tracking-wide text-ink capitalize">{data.word}</h3>
```
to:
```jsx
<h3 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink capitalize">{data.word}</h3>
```

- [ ] **Step 4: Words page** — no required edits (favorite amber + red error are semantic). Open and confirm the favorites toggle (line 151) still reads fine against the blue theme; the amber star is intentional. No change.

- [ ] **Step 5: Verify**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/(dashboard)/chat/page.jsx app/(dashboard)/practice/page.jsx components/WordOfDay.jsx
git commit -m "redesign: sentence-case display headings across dashboard"
```

---

## Task 14: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Confirm no leftover Bebas / old theme references**

Run: `git grep -n "Bebas\|tracking-\[0\.1em\]\|f05a1a\|fdc99e\|f9924e\|c94710\|e8e5de\|f0ede6"`
Expected: no matches in `app/`, `components/`, `tailwind.config.js` (only allowed match: the design-spec doc under `docs/`).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: clean (no errors/warnings introduced).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual visual pass**

Run `npm run dev` and walk through in **both light and dark**:
- `/` logged-out (Start free / Sign in) and, after signing in, logged-in (Go to dashboard CTA).
- `/login`, `/register` — sentence-case headings, blue accents.
- `/statistics` — blue heatmap ramp, blue stat accents.
- `/words`, `/practice`, `/chat`, `/settings` — white cards, blue accents, no orange/beige, no condensed-caps headings.
Confirm AI chat output still renders via `FormattedText` (no `dangerouslySetInnerHTML`). Stop the dev server.

- [ ] **Step 5: Final commit (if any tweaks were needed)**

```bash
git add -A
git commit -m "redesign: final verification tweaks"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- §3.1 tokens → Task 1. §3.2 typography → Task 1 (fonts) + Tasks 11/13 (heading copy). §3.3 component classes → Task 2.
- §4 landing (9 sections) → Tasks 3–10. Header→6, Hero→6, LogoCloud→7, Features→7, Comparison→8, Journey→8, Pricing→9, CTA→9, Footer→9, wiring + session CTA→10.
- §5 app polish (every listed surface) → Tasks 11–13. (Feedback/AddWordModal/BulkImportModal/WordCard/CategoryBreakdown/RecentActivity audited as needing no edits — semantic colors retained; noted in tasks.)
- §6 componentization → Tasks 3–9 file layout. §7 verification → Task 14.

**Placeholder scan:** No TBD/TODO; every code step contains complete code; no "similar to Task N" omissions.

**Type/naming consistency:** Icon names (`ArrowRight`, `Check`, `X`, `Sparkle`, `Chat`, `Repeat`, `Bulb`, `Cards`, `Chart`, `Search`, `Flame`) defined in Task 3 and used consistently in Tasks 4–9. `SkyBand`/`SectionLabel`/`TwoToneHeading`/`FeatureCard`/`CheckRow`/`PlanCard` defined in Task 4, imported by exact name in Tasks 6–9. `brand-navy`/`brand-navy-hover` defined in Task 1, used in Task 2/11. `loggedIn` prop threaded consistently (page→Header/Hero/CTA).

**Note on `StreakHeatmap`:** Task 12 preserves the existing helper name/signature and swaps only hex literals, since the exact identifier wasn't read in full — executor must keep the surrounding code intact.
