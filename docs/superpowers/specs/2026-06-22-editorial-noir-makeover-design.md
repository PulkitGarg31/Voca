# VOCA UI/UX Makeover — "Editorial Noir"

Date: 2026-06-22
Status: Approved (design + scope confirmed by user)

## Overview

A full visual makeover of VOCA, shifting from the current cool teal "Shoreline"
palette to a warm, literary **Editorial** identity inspired by a dark, cinematic
reference. The makeover keeps the existing light + dark theme toggle: a calm light
**Editorial** theme and a dramatic dark **Noir** theme.

Because the app is themed entirely through semantic CSS-variable tokens in
`app/globals.css` (exposed to Tailwind as `rgb(var(--x) / <alpha>)`), retuning the
tokens re-skins the whole app at once; the rest of the work is bespoke layout on
the landing + auth and targeted component polish on the dashboard.

## Goals

- A premium, "literary dictionary" feel — not the crypto/gaming look of the reference.
- One coherent system across **landing, auth, and the full dashboard**.
- Both themes remain first-class (toggle stays).
- No regressions: `npm run lint` + `npm run build` stay clean.

## Non-goals

- No new product features or routes; this is visual only.
- No data-model changes.
- Not a literal clone of the reference (it's a token sale page; VOCA is a vocab app).

## Design decisions

### Typography (the primary lever)
- **Display / headings → Fraunces** (literary "old-style" serif), loaded via
  `next/font/google`, wired as `--font-display`. Replaces Bricolage Grotesque.
- **Body / UI → Inter** (unchanged) for dense-screen readability.
- Headline numerals (stat cards, "word of the day") use Fraunces for character.

### Palette (semantic tokens, RGB channels)

**Editorial — light (`:root`)** — warm ivory paper, near-black ink, deep bronze accent:
```
--bg 246 242 234   --surface 255 253 248   --surface-2 239 233 221
--line 227 220 205 --line-strong 211 201 181
--ink 33 28 21     --muted 93 86 72        --faint 139 130 112
--ghost 239 233 221 --ghost-hover 230 222 205
--accent 138 109 47 (#8A6D2F)  --accent-hover 112 88 36
--brand-navy 33 28 21 (deep ink — primary button)  --brand-navy-hover 51 44 33
--sky-from 247 240 226  --sky-to 246 242 234   --cell-0 233 226 210
```

**Noir — dark (`.dark`)** — ink-charcoal paper, warm off-white text, restrained gold:
```
--bg 16 14 20      --surface 26 24 34       --surface-2 35 32 44
--line 46 42 56    --line-strong 58 53 71
--ink 236 232 241  --muted 169 163 182      --faint 110 104 125
--ghost 35 32 44   --ghost-hover 46 42 56
--accent 220 180 106 (#DCB46A)  --accent-hover 231 201 138
--brand-navy 220 180 106 (gold — primary button)  --brand-navy-hover 231 201 138
--sky-from 26 22 40  --sky-to 16 14 20   --cell-0 35 32 44
```

Accent contrast: bronze `#8A6D2F` clears AA on the light paper; gold text clears AA
on the dark paper.

### Components
- **Primary button** (`.btn-primary`): currently hardcodes `text-white`. It will be
  updated to take its ink from a token so it reads in both themes — deep-ink fill +
  off-white text in Editorial, gold fill + near-black text in Noir. Add `--on-primary`
  token (light: `255 253 248`, dark: `26 18 6`).
- Pill button shapes kept (they match the reference and the existing system).
- Warm hairline borders; serif headings/numerals; glass treatment on hero cards;
  existing scroll-reveal animations carry over.

### Landing
Restructure into a cinematic editorial hero: large serif `Voca` wordmark (italic
gold "ca"), serif tagline, frosted "Word of the day" glass card, gold/ink CTAs, and
a large typographic quotation-mark visual (no photo asset needed). Existing sections
(Features, Comparison, Journey, CTA, Footer) restyled to the system; reveal-on-scroll
retained.

### Auth
`AuthShell` + login/register restyled to the editorial system (serif headings, warm
panels, the branded side panel adopting the Noir hero treatment).

### Dashboard
Mostly automatic via tokens; targeted polish where components carry their own styling:
Navbar (active state → accent), stat cards, word cards, practice cards/buttons, chat
bubbles, Word/Idiom-of-the-day cards, streak heatmap (`--cell-0`).

## Work breakdown
1. **Foundation** — `app/globals.css` tokens for both themes + `--on-primary`;
   `.btn-primary` ink token; `layout.jsx` + `tailwind.config.js` wire Fraunces.
2. **Landing** — bespoke hero + restyle sections.
3. **Auth** — AuthShell + login/register.
4. **Dashboard polish** — components above.
5. **Verify** — `npm run lint` + `npm run build`; visual check of every route in both themes.

## Verification
- Lint + build clean (the project's bar).
- Manually view each route in **both** themes (toggle) — no unreadable text, no
  leftover teal, contrast holds.
