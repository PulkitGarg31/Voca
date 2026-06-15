import { Flame } from "@/components/landing/Icons";

// Pure-CSS phone frame showing a simplified VOCA dashboard. No image assets.
export default function DevicePreview() {
  const bars = [40, 65, 50, 90, 70, 55, 80];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="relative mx-auto w-[260px]">
      <div className="rounded-[2.5rem] border-[6px] border-ink/90 bg-surface shadow-2xl overflow-hidden">
        <div className="bg-surface px-4 pt-5 pb-6 space-y-4">
          {/* header */}
          <div className="flex items-center justify-between">
            <span className="font-display text-base font-extrabold tracking-tight text-ink">VOCA</span>
            <span className="h-7 w-7 rounded-full bg-accent/15" />
          </div>
          {/* streak */}
          <div className="rounded-2xl bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-accent">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-semibold">Daily streak</span>
            </div>
            <p className="mt-1 text-2xl font-extrabold text-ink">12 days</p>
          </div>
          {/* mini chart */}
          <div className="rounded-2xl border border-line p-4">
            <p className="text-[11px] font-semibold text-muted mb-3">Words this week</p>
            <div className="flex items-end justify-between gap-1.5 h-20">
              {bars.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-md ${i === 3 ? "bg-accent" : "bg-accent/25"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-faint">{days[i]}</span>
                </div>
              ))}
            </div>
          </div>
          {/* word row */}
          <div className="rounded-2xl border border-line p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-ink">eloquent</p>
              <p className="text-[10px] text-muted">fluent & persuasive</p>
            </div>
            <span className="badge bg-accent/10 text-accent">Lv 4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
