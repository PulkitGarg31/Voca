"use client";
import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/categories";
import { useDictionary } from "@/hooks/useDictionary";
import { playWord } from "@/lib/audio";

export default function AddWordModal({ onClose, onSaved, editWord = null }) {
  const isEdit = Boolean(editWord);
  const [word, setWord] = useState(editWord?.word || "");
  const [lookupData, setLookupData] = useState(
    isEdit
      ? { word: editWord.word, phonetic: editWord.phonetic, audioUrl: editWord.audioUrl, meanings: editWord.meanings }
      : null
  );
  const [category, setCategory] = useState(editWord?.category || "Other");
  const [notes, setNotes] = useState(editWord?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { loading: fetching, lookup } = useDictionary();

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleLookup() {
    if (!word.trim()) return;
    setError("");
    const data = await lookup(word.trim());
    if (!data) {
      // Keep the existing data — never blow away a saved definition on a miss.
      setError(`"${word.trim()}" was not found in the dictionary`);
      return;
    }
    setLookupData(data);
  }

  async function handleSave() {
    if (!word.trim()) return;
    setSaving(true);
    setError("");
    try {
      // Fall back to the original word's data so an edit that doesn't re-look-up
      // (or a failed refresh) never overwrites the stored definition with empties.
      const source = lookupData || (isEdit ? editWord : null);
      const payload = {
        phonetic: source?.phonetic || "",
        audioUrl: source?.audioUrl || "",
        meanings: source?.meanings || [],
        category,
        notes,
      };
      let res;
      if (isEdit) {
        res = await fetch(`/api/words/${editWord._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/words", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: word.trim(), ...payload }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      onSaved?.(data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="addword-title" className="bg-surface rounded-2xl w-full max-w-md shadow-2xl border border-line" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="addword-title" className="font-display text-base font-semibold text-ink">{isEdit ? "Edit word" : "Add new word"}</h2>
          <button onClick={onClose} className="text-faint hover:text-ink transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* Word lookup */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Word</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1 disabled:opacity-60"
                placeholder="e.g. ephemeral"
                value={word}
                disabled={isEdit}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
              <button onClick={handleLookup} disabled={fetching || !word.trim()} className="btn-ghost px-3 text-xs flex-shrink-0">
                {fetching ? "Looking up…" : isEdit ? "Refresh" : "Look up"}
              </button>
            </div>
          </div>

          {/* Dictionary result */}
          {lookupData && (
            <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-accent capitalize">{lookupData.word}</p>
                {lookupData.phonetic && <span className="text-xs text-accent/80">{lookupData.phonetic}</span>}
                <button onClick={() => playWord(lookupData.audioUrl, lookupData.word)} className="text-accent hover:text-accent-hover transition-colors" title="Play pronunciation">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                </button>
              </div>
              {lookupData.meanings?.slice(0, 2).map((m, i) => (
                <div key={i} className="mb-1.5">
                  <span className="text-[10px] italic text-accent/80">{m.partOfSpeech}</span>
                  <p className="text-xs text-ink/80 mt-0.5">{m.definitions?.[0]?.definition}</p>
                </div>
              ))}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                    category === c
                      ? "bg-ink text-[rgb(var(--on-primary))] border-ink"
                      : "bg-surface-2 border-line text-muted hover:text-ink hover:border-line-strong"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-muted mb-1.5">Personal note (optional)</label>
            <textarea
              rows={2}
              className="input resize-none"
              placeholder="Memory trick, context, sentence…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-line">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving || !word.trim()} className="btn-primary flex-1">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Save word"}
          </button>
        </div>
      </div>
    </div>
  );
}
