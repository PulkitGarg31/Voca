"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { label: "Statistics", href: "/statistics" },
  { label: "Words", href: "/words" },
  { label: "Practice", href: "/practice" },
  { label: "AI Chat", href: "/chat" },
  { label: "Settings", href: "/settings" },
];

export default function Navbar({ user }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <div className="bg-surface/80 backdrop-blur border border-line rounded-full px-5 py-2.5 flex items-center justify-between shadow-sm">
        {/* Logo */}
        <Link href="/statistics" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 bg-surface-2 rounded-full p-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                path === item.href ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden md:flex" />
          <div className="hidden md:flex items-center gap-2 bg-ghost-hover rounded-full px-3 py-1.5">
            <div className="w-5 h-5 rounded-full bg-ink flex items-center justify-center text-[9px] text-white font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-xs font-medium text-ink/80">{user?.name?.split(" ")[0]}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hidden md:block bg-ink hover:opacity-80 text-white text-xs font-semibold px-4 py-2 rounded-full transition-opacity"
          >
            Sign out
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden bg-brand-navy text-white text-xs font-semibold px-4 py-2 rounded-full"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mt-2 bg-ghost rounded-2xl px-4 py-3 flex flex-col gap-1 shadow-sm md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                path === item.href ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm font-semibold text-muted">Theme</span>
            <ThemeToggle />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 text-left px-3 py-2 text-sm text-accent font-semibold"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
