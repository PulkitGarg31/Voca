"use client";
import { useState, useMemo } from "react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Warm gold → deep bronze intensity ramp — reads well on both the warm ivory
// (Editorial) and charcoal (Noir) surfaces while staying in the accent family.
function cellColor(count) {
  if (!count) return "rgb(var(--cell-0))";
  if (count <= 2) return "#E8CF96"; // pale gold
  if (count <= 5) return "#D4A84E"; // gold
  if (count <= 10) return "#A87C2E"; // bronze
  return "#6E5320"; // deep bronze
}
const LEGEND = ["rgb(var(--cell-0))", "#E8CF96", "#D4A84E", "#A87C2E", "#6E5320"];

// Build keys in UTC to match the server (/api/stats keys activity by
// createdAt.toISOString(), i.e. UTC date). Keeps cells and counts aligned.
function fmtKey(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthsData(activityMap, year) {
  return MONTH_NAMES.map((name, monthIdx) => {
    const monthStart = new Date(Date.UTC(year, monthIdx, 1));
    const monthEnd = new Date(Date.UTC(year, monthIdx + 1, 0));
    const rawDow = monthStart.getUTCDay();
    const padding = new Array(rawDow === 0 ? 6 : rawDow - 1).fill(null);
    const days = [];
    for (let d = new Date(monthStart); d <= monthEnd; d.setUTCDate(d.getUTCDate() + 1)) {
      const cur = new Date(d);
      const key = fmtKey(cur);
      const count = activityMap[key] || 0;
      days.push({ key, count, label: `${name} ${cur.getUTCDate()}, ${year}` });
    }
    return { name, padding, days };
  });
}

function longestFmt(streak) {
  if (!streak?.longestStart) return null;
  const fmt = (dt) => new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(streak.longestStart)} – ${fmt(streak.longestEnd)}`;
}

export default function StreakHeatmap({ activityMap = {}, streak }) {
  const currentYear = new Date().getUTCFullYear(); // match the UTC keys used below
  const years = useMemo(() => {
    const ys = new Set([String(currentYear)]);
    Object.keys(activityMap).forEach((k) => ys.add(k.slice(0, 4)));
    return [...ys].sort().reverse();
  }, [activityMap, currentYear]);

  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const monthsData = useMemo(
    () => buildMonthsData(activityMap, Number(selectedYear)),
    [activityMap, selectedYear]
  );

  return (
    <div className="border border-line rounded-2xl overflow-hidden">
      <div className="p-5 bg-surface">
        <div className="flex justify-end mb-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-surface-2 text-muted text-xs border border-line rounded-full px-3 py-1.5 outline-none cursor-pointer hover:border-accent transition-colors"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="flex gap-1.5 w-full justify-between overflow-x-auto scrollbar-thin">
          {monthsData.map((month) => (
            <div key={month.name} className="flex flex-col gap-1">
              <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
                {month.padding.map((_, i) => <div key={`pad-${i}`} className="w-2.5 h-2.5" />)}
                {month.days.map((day) => (
                  <div
                    key={day.key}
                    title={`${day.count} ${day.count === 1 ? "activity" : "activities"} on ${day.label}`}
                    className="w-2.5 h-2.5 rounded-[2px] hover:opacity-70 transition-opacity cursor-pointer"
                    style={{ backgroundColor: cellColor(day.count) }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-faint select-none text-center mt-0.5 tracking-wide">{month.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-faint select-none">
          <span>Less</span>
          {LEGEND.map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-2 px-5 py-4 border-t border-line bg-surface-2">
        <div>
          <span className="font-display text-[2.5rem] leading-none text-accent">{streak?.current ?? 0}</span>
          <span className="section-label ml-2">current streak</span>
        </div>
        <div className="text-right">
          <span className="font-display text-[2.5rem] leading-none text-ink">{streak?.longest ?? 0}</span>
          <span className="section-label ml-2">longest streak</span>
          {longestFmt(streak) && <p className="text-[10px] text-faint mt-0.5">{longestFmt(streak)}</p>}
        </div>
      </div>
    </div>
  );
}
