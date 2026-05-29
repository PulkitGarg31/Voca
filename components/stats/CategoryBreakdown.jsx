import { catStyle } from "@/lib/categories";

export default function CategoryBreakdown({ categories = [], total }) {
  const sorted = [...categories].sort((a, b) => b.count - a.count);
  return (
    <div className="panel p-4">
      {sorted.length === 0 && <p className="text-sm text-faint text-center py-4">No words yet</p>}
      <div className="space-y-3">
        {sorted.map((cat) => {
          const pct = total ? Math.round((cat.count / total) * 100) : 0;
          const c = catStyle(cat.name);
          return (
            <div key={cat.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink font-medium">{cat.name}</span>
                <span className="text-faint">{cat.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${c.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <div className="mt-4 pt-3 border-t border-line text-xs text-faint">
          Total: <span className="font-semibold text-accent">{total} words</span>
        </div>
      )}
    </div>
  );
}
