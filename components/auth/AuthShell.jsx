"use client";
import Link from "next/link";
import { SkyBackdrop } from "@/components/landing/Sky";
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
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <SkyBackdrop />
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <LogoTile />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink">
            Build a vocabulary <br /> that <span className="text-accent">finally sticks</span>
          </h2>
          <p className="mt-4 text-ink/70">
            Learn words 10× faster with AI chat, spaced repetition, and smart practice.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-ink/80">
                <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/70 text-accent shadow-sm dark:bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-ink/50">© 2026 VOCA — learn words that stick.</p>
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
