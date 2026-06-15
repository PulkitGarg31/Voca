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
