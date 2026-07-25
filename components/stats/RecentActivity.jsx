import { catStyle } from "@/lib/categories";

function relativeDate(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecentActivity({ words = [] }) {
  if (!words.length)
    return (
      <div className="panel p-4">
        <p className="text-sm text-faint text-center py-4">No words added yet</p>
      </div>
    );
  return (
    <div className="panel divide-y divide-line">
      {words.map((w) => {
        const c = catStyle(w.category);
        const def = w.meanings?.[0]?.definitions?.[0]?.definition || "No definition yet";
        return (
          <div key={w._id} className="flex items-start gap-3 p-3.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.badge}`}>
              {w.word[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink capitalize truncate">{w.word}</p>
                <span className="text-[10px] text-faint flex-shrink-0">{relativeDate(w.createdAt)}</span>
              </div>
              <p className="text-xs text-muted mt-0.5 line-clamp-1">{def}</p>
              <span className={`badge mt-1 ${c.badge}`}>{w.category}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
