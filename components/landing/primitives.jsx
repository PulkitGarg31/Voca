import Link from "next/link";
import { Check, ArrowRight, X } from "@/components/landing/Icons";

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
      <Link
        href={href}
        className={`text-center text-sm font-semibold px-6 py-3 rounded-full transition-all ${
          highlighted ? "bg-white text-ink hover:bg-white/90" : "btn-ghost"
        }`}
      >
        {cta}
      </Link>
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
