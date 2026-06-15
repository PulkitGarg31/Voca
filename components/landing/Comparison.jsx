import { SkySection } from "@/components/landing/Sky";
import { Check, X, Book, Sparkle } from "@/components/landing/Icons";

// Each row compares one dimension: the old way (red) vs the VOCA way (blue).
const ROWS = [
  { label: "Time to fluency", old: "2–3 years", neo: "Weeks, not years" },
  { label: "Personalization", old: "One-size-fits-all", neo: "Adapts every session" },
  { label: "Practice", old: "Limited, scheduled", neo: "Unlimited, anytime" },
  { label: "Availability", old: "Fixed class times", neo: "24/7, any device" },
  { label: "Cost", old: "$$$ courses", neo: "Free to start" },
  { label: "Feedback", old: "Delayed, generic", neo: "Instant, AI-powered" },
];

function Pill({ children, negative }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        negative ? "bg-red-500/10 text-red-500" : "bg-accent/10 text-accent"
      }`}
    >
      {negative ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      {children}
    </span>
  );
}

export default function Comparison() {
  return (
    <SkySection id="difference" className="py-28 md:py-32" waveTop waveTopFill="fill-bg" waveBottom waveBottomFill="fill-bg">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60">The difference</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-5xl">
            Rote memorization vs.
            <br className="hidden sm:block" /> the <span className="text-accent">VOCA way</span>
          </h2>
          <p className="mt-4 max-w-md text-ink/70">
            Traditional study is slow and forgettable. VOCA flips the script with AI and a scheduler built around how memory actually works.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Old way */}
          <div className="rounded-3xl border border-line/60 bg-surface/95 p-6 shadow-lg backdrop-blur md:p-7">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <Book className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">Traditional study</h3>
                <p className="text-xs text-muted">Textbooks, classes, apps</p>
              </div>
            </div>
            <dl>
              {ROWS.map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-line/60 py-3.5 last:border-0">
                  <dt className="text-sm text-muted">{r.label}</dt>
                  <dd><Pill negative>{r.old}</Pill></dd>
                </div>
              ))}
            </dl>
          </div>

          {/* VOCA way */}
          <div className="rounded-3xl border-2 border-accent/30 bg-surface p-6 shadow-2xl md:p-7">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <Sparkle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-accent">VOCA</h3>
                <p className="text-xs text-muted">AI-powered, adaptive</p>
              </div>
            </div>
            <dl>
              {ROWS.map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-line/60 py-3.5 last:border-0">
                  <dt className="text-sm text-ink">{r.label}</dt>
                  <dd><Pill>{r.neo}</Pill></dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </SkySection>
  );
}
