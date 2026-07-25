"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoTile } from "@/components/Logo";

// Section links live on the landing page; page links are real routes. The active
// pill follows the open page, and on the landing page a scroll-spy hands it to
// whichever section is under the reader.
const LINKS = [
  { label: "Home", href: "/", page: "/" },
  { label: "Features", href: "/#features", section: "features" },
  { label: "How it works", href: "/#journey", section: "journey" },
  { label: "About", href: "/about", page: "/about" },
];

export default function MarketingHeader({ loggedIn }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [section, setSection] = useState(null);

  // Fixed header: transparent over the hero sky, frosted once content scrolls under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: on the landing page, the section crossing the upper-middle of the
  // viewport owns the highlight; elsewhere (or above all sections) it's the page's.
  useEffect(() => {
    if (pathname !== "/") {
      setSection(null);
      return;
    }
    const ids = LINKS.filter((l) => l.section).map((l) => l.section);
    const onScroll = () => {
      const mid = window.innerHeight * 0.4;
      let current = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) current = id;
        }
      }
      setSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const isActive = (link) => {
    if (link.section) return pathname === "/" && section === link.section;
    if (link.page === "/") return pathname === "/" && !section;
    return pathname === link.page;
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled ? "bg-bg/85 backdrop-blur border-b border-line/60 shadow-sm" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoTile />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">
            VOCA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-full border border-line bg-surface/60 px-1.5 py-1 backdrop-blur">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive(l)
                  ? "bg-accent text-[rgb(var(--on-primary))]"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
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
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`nav-item ${isActive(l) ? "bg-accent/10 text-accent font-semibold" : ""}`}
            >
              {l.label}
            </Link>
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
