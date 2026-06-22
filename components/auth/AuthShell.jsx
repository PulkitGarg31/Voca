"use client";
import Link from "next/link";
import { LogoTile } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { Chat, Repeat, Chart } from "@/components/landing/Icons";

const POINTS = [
  { icon: Chat, text: "Chat with an AI tutor that uses your words in context" },
  { icon: Repeat, text: "Spaced repetition resurfaces words before you forget" },
  { icon: Chart, text: "Track mastery, streaks, and what's due for review" },
];

// Split-screen auth frame: branded sky panel + form column. The page passes the
// heading and the form itself as children, so all auth logic stays in the page.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel — the Noir hero: layered ink/charcoal atmosphere, a soft
          gold accent glow, a hairline warm border, and an oversized serif
          flourish. Built from semantic tokens so it reads as warm ivory + bronze
          in the Editorial (light) theme and charcoal + gold in Noir (dark). */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-bg p-12 lg:flex">
        {/* atmosphere */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-2 via-bg to-bg" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        {/* oversized typographic flourish */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-6 select-none font-display text-[20rem] font-extrabold italic leading-none text-accent/10"
        >
          Aa
        </span>

        <Link href="/" className="relative z-10 inline-flex items-center gap-2.5">
          <LogoTile />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <span className="section-label">Editorial Noir</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink">
            Build a vocabulary <br /> that <span className="italic text-accent">finally sticks</span>
          </h2>
          <p className="mt-4 text-muted">
            Learn words 10× faster with AI chat, spaced repetition, and smart practice.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted">
                <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-accent shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-faint">© 2026 VOCA — learn words that stick.</p>
      </div>

      {/* Form column */}
      <div className="relative flex min-h-screen flex-col bg-bg px-6 py-6 sm:px-10 lg:min-h-0">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible">
            <LogoTile className="h-8 w-8" />
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
