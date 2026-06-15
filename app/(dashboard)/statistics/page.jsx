"use client";
import StreakHeatmap from "@/components/stats/StreakHeatmap";
import CategoryBreakdown from "@/components/stats/CategoryBreakdown";
import RecentActivity from "@/components/stats/RecentActivity";
import WordOfDay from "@/components/WordOfDay";
import { useStats } from "@/hooks/useStats";

function StatCard({ icon, iconBg, value, label }) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-ink leading-tight">{value}</p>
        <p className="section-label mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function fmtTime(secs) {
  if (!secs) return "0m";
  if (secs < 60) return `${secs}s`;
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

function Ring({ value, max }) {
  const pct = max ? Math.min(1, value / max) : 0;
  const r = 32;
  const c = 2 * Math.PI * r;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="flex-shrink-0">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgb(var(--surface-2))" strokeWidth="8" />
      <circle
        cx="42" cy="42" r={r} fill="none" stroke="rgb(var(--accent))" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 42 42)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="42" y="47" textAnchor="middle" className="fill-ink font-bold" style={{ fontSize: "18px" }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export default function StatisticsPage() {
  const { data, loading, error, refetch } = useStats();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error || !data?.overall)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="section-label">Couldn&apos;t load statistics</p>
        <p className="font-display text-3xl font-extrabold tracking-tight text-ink">Couldn&apos;t load stats</p>
        <button onClick={() => location.reload()} className="btn-primary mt-2">Reload</button>
      </div>
    );

  const { overall, today, weekly, categories, activityMap, recentWords } = data;

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20">
      {/* Hero */}
      <div className="pt-2 pb-8 border-b border-line">
        <p className="section-label mb-2">Learning statistics</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-ink">Your progress</h1>
          <div className="flex gap-8">
            <div>
              <p className="font-display text-4xl font-extrabold leading-none text-ink">{overall.totalWords}</p>
              <p className="section-label mt-1.5">Words learned</p>
            </div>
            <div>
              <p className="font-display text-4xl font-extrabold leading-none text-accent">{overall.streak.current}</p>
              <p className="section-label mt-1.5">Day streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's goal + review queue */}
      {today && (
        <div className="py-10 border-b border-line">
          <p className="section-label mb-5">Today</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="panel p-5 flex items-center gap-5">
              <Ring value={today.progress} max={today.goal} />
              <div>
                <p className="text-2xl font-bold text-ink leading-tight">
                  {today.progress}<span className="text-faint text-base font-medium"> / {today.goal}</span>
                </p>
                <p className="section-label mt-0.5">Daily goal</p>
                <p className="text-xs text-faint mt-1">
                  {today.met ? "🎉 Goal reached — nice work!" : `${today.added} added · ${today.practiced} practised`}
                </p>
              </div>
            </div>
            <div className="panel p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-bold text-ink leading-tight">{overall.dueCount ?? 0}</p>
                <p className="section-label mt-0.5">Due for review</p>
                <p className="text-xs text-faint mt-1">Spaced-repetition queue</p>
              </div>
              {overall.dueCount > 0 ? (
                <a href="/practice" className="btn-primary text-xs py-2.5 px-5 whitespace-nowrap">Review now</a>
              ) : (
                <span className="text-xs text-faint">All caught up ✓</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Word of the day */}
      <div className="py-10 border-b border-line">
        <WordOfDay onAdded={refetch} />
      </div>

      {/* Overall stats */}
      <div className="py-10 border-b border-line">
        <p className="section-label mb-5">Overall</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            iconBg="bg-accent/10"
            icon={<svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>}
            value={overall.totalWords}
            label="Words learned"
          />
          <StatCard
            iconBg="bg-ink/10"
            icon={<svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            value={fmtTime(overall.totalTime)}
            label="Time spent"
          />
          <StatCard
            iconBg="bg-accent/10"
            icon={<svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 14c.6-1.4.7-2.9.4-4.4A9 9 0 007.6 3C7 6.2 7.8 9.6 10 12l1 1-4 5.5A2 2 0 009 21h6a2 2 0 002-2v-3z" /></svg>}
            value={`${overall.streak.current}d`}
            label="Current streak"
          />
        </div>
      </div>

      {/* Heatmap */}
      <div className="py-10 border-b border-line">
        <p className="section-label mb-5">Activity heatmap</p>
        <StreakHeatmap activityMap={activityMap} streak={overall.streak} />
      </div>

      {/* Weekly */}
      <div className="py-10 border-b border-line">
        <div className="flex items-end justify-between mb-5">
          <p className="section-label">This week</p>
          <span className="text-xs text-faint">Last 7 days</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            iconBg="bg-accent/10"
            icon={<svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>}
            value={weekly.words}
            label="Words added"
          />
          <StatCard
            iconBg="bg-ink/10"
            icon={<svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            value={fmtTime(weekly.time)}
            label="Time this week"
          />
          <StatCard
            iconBg="bg-accent/10"
            icon={<svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
            value={weekly.avgWordsPerDay}
            label="Avg words / day"
          />
        </div>
      </div>

      {/* Bottom */}
      <div className="py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="section-label mb-4">Categories</p>
            <CategoryBreakdown categories={categories} total={overall.totalWords} />
          </div>
          <div>
            <p className="section-label mb-4">Recent words</p>
            <RecentActivity words={recentWords} />
          </div>
        </div>
      </div>
    </div>
  );
}
