import { Flame, Chat } from "@/components/landing/Icons";

// Pure-CSS phone frame showing a simplified VOCA dashboard. No image assets.
export default function DevicePreview({ className = "" }) {
  const bars = [42, 64, 50, 92, 70, 56, 80];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const ring = 73; // % progress
  const C = 2 * Math.PI * 26; // ring circumference
  return (
    <div className={`relative mx-auto w-[270px] ${className}`}>
      {/* glow under device */}
      <div aria-hidden className="absolute -inset-4 -z-10 rounded-[3rem] bg-accent/15 blur-2xl" />
      <div className="rounded-[2.6rem] border-[7px] border-ink bg-ink p-1.5 shadow-2xl dark:border-line-strong dark:bg-surface-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-surface">
          {/* notch */}
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink dark:bg-bg" />
          <div className="space-y-3.5 px-4 pb-5 pt-9">
            {/* header */}
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-extrabold tracking-tight text-ink">VOCA</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Chat className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* streak + progress ring */}
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl bg-accent/10 p-3">
                <div className="flex items-center gap-1.5 text-accent">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold">Streak</span>
                </div>
                <p className="mt-0.5 text-xl font-extrabold text-ink">12<span className="text-xs font-medium text-muted"> days</span></p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-line p-3">
                <svg viewBox="0 0 60 60" className="h-12 w-12 -rotate-90">
                  <circle cx="30" cy="30" r="26" fill="none" strokeWidth="7" className="stroke-accent/15" />
                  <circle
                    cx="30" cy="30" r="26" fill="none" strokeWidth="7" strokeLinecap="round"
                    className="stroke-accent"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - ring / 100)}
                  />
                </svg>
                <div className="leading-tight">
                  <p className="text-base font-extrabold text-ink">{ring}%</p>
                  <p className="text-[10px] text-muted">mastered</p>
                </div>
              </div>
            </div>

            {/* weekly chart */}
            <div className="rounded-2xl border border-line p-3">
              <p className="mb-2 text-[10px] font-semibold text-muted">Words this week</p>
              <div className="flex h-16 items-end justify-between gap-1">
                {bars.map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`w-full rounded-sm ${i === 3 ? "bg-accent" : "bg-accent/25"}`} style={{ height: `${h}%` }} />
                    <span className="text-[8px] text-faint">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* chips */}
            <div className="flex gap-1.5">
              {["Daily", "Work", "Travel"].map((c, i) => (
                <span key={c} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${i === 0 ? "bg-accent text-[rgb(var(--on-primary))]" : "bg-surface-2 text-muted"}`}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
