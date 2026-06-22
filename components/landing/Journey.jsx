import { SectionLabel, TwoToneHeading } from "@/components/landing/primitives";
import { Chart, Check, Flame } from "@/components/landing/Icons";

const POINTS = ["Spaced-repetition scheduling", "Mastery level tracking", "AI-guided practice sessions"];
const bars = [45, 70, 55, 95, 75, 60, 85];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Journey() {
  return (
    <section id="journey" className="mx-auto max-w-6xl px-4 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
      {/* preview card */}
      <div className="panel p-6 order-2 lg:order-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-line bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-accent text-xs font-semibold"><Flame className="h-4 w-4" /> Daily streak</div>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">42 days</p>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold text-muted">Mastery</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">B2 <span className="text-sm font-medium text-muted">Upper-Int.</span></p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-line p-5">
          <p className="text-xs font-semibold text-muted mb-4">Words mastered this week</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full rounded-md ${i === 3 ? "bg-accent" : "bg-accent/25"}`} style={{ height: `${h}%` }} />
                <span className="text-[10px] text-faint">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* copy */}
      <div className="order-1 lg:order-2">
        <SectionLabel icon={Chart}>Progress you can see</SectionLabel>
        <TwoToneHeading className="mt-4" top="Visualize your journey" accent="to true fluency" />
        <p className="mt-4 text-muted max-w-md">
          Data-driven insights help you focus on what matters. Track vocabulary growth, mastery, and review accuracy over time.
        </p>
        <ul className="mt-6 space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="checklist-row">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Check className="h-3.5 w-3.5" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
