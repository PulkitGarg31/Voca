"use client";
import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";

const MAX_WORDS = 50;

export default function BulkImportModal({ onClose, onDone }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Other");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null); // { added, skipped, failed }

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && !running) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, running]);

  function parseWords() {
    return [...new Set(
      text
        .split(/[\n,]+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => /^[a-z][a-z'\- ]*$/.test(w))
    )].slice(0, MAX_WORDS);
  }

  async function run() {
    const words = parseWords();
    if (words.length === 0) return;
    setRunning(true);
    setResult(null);
    setProgress({ done: 0, total: words.length });
    let added = 0, skipped = 0, failed = 0;

    for (const word of words) {
      try {
        const dictRes = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
        const dict = dictRes.ok ? await dictRes.json() : null;
        const res = await fetch("/api/words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word,
            phonetic: dict?.phonetic || "",
            audioUrl: dict?.audioUrl || "",
            meanings: dict?.meanings || [],
            category,
          }),
        });
        if (res.status === 409) skipped += 1;
        else if (res.ok) added += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResult({ added, skipped, failed });
    setRunning(false);
    if (added > 0) onDone?.();
  }

  const parsedCount = parseWords().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="import-title" className="bg-surface border border-line rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="import-title" className="font-display text-base font-semibold text-ink">Import words</h2>
          <button onClick={onClose} className="text-faint hover:text-ink transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">Paste words (one per line or comma-separated)</label>
            <textarea
              rows={6}
              className="input resize-none font-mono text-xs"
              placeholder={"ephemeral\nubiquitous\nserendipity"}
              value={text}
              disabled={running}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-[11px] text-faint mt-1">{parsedCount} valid word{parsedCount === 1 ? "" : "s"} detected{parsedCount >= MAX_WORDS ? ` (max ${MAX_WORDS})` : ""}. Definitions are auto-filled.</p>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Category for all</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  disabled={running}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-lg text-xs border transition-all ${category === c ? "bg-ink text-[rgb(var(--on-primary))] border-ink" : "bg-surface-2 border-line text-muted hover:text-ink hover:border-line-strong"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {running && (
            <div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
              </div>
              <p className="text-[11px] text-faint mt-1">Importing {progress.done} / {progress.total}…</p>
            </div>
          )}

          {result && (
            <div className="text-xs rounded-lg border border-line bg-surface-2 p-3 text-ink">
              <p><span className="text-emerald-600 dark:text-emerald-400 font-semibold">{result.added}</span> added · <span className="font-semibold">{result.skipped}</span> already in list · <span className="text-red-500 font-semibold">{result.failed}</span> failed</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-line">
          <button onClick={onClose} className="btn-ghost flex-1">{result ? "Done" : "Cancel"}</button>
          <button onClick={run} disabled={running || parsedCount === 0} className="btn-primary flex-1">
            {running ? "Importing…" : `Import ${parsedCount || ""}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}
