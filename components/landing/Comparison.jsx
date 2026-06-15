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
