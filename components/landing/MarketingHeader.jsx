"use client";
import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#journey" },
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
          <ThemeToggle />
          {loggedIn ? (
            <Link href="/statistics" className="btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-ink hover:text-accent transition-colors">Sign in</Link>
              <Link href="/register" className="btn-primary">Start free</Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setOpen((v) => !v)} className="btn-ghost px-4 py-2">Menu</button>
        </div>
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
