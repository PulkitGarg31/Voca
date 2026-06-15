"use client";
import { useState, useEffect } from "react";
import AddWordModal from "@/components/words/AddWordModal";
import BulkImportModal from "@/components/words/BulkImportModal";
import WordCard from "@/components/words/WordCard";
import { useWords } from "@/hooks/useWords";
import { ALL_CATEGORIES } from "@/lib/categories";
import { useToast, useConfirm } from "@/components/Feedback";

const SORT_OPTIONS = [
  { value: "recent", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A–Z" },
  { value: "za", label: "Z–A" },
  { value: "mastery_low", label: "Mastery ↑" },
  { value: "mastery_high", label: "Mastery ↓" },
];
const MASTERY_FILTERS = [
  { value: "all", label: "All levels" },
  { value: "struggling", label: "Struggling" },
  { value: "mastered", label: "Mastered" },
];

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Skeleton() {
  return (
    <div className="word-card animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-surface-2 rounded" />
        <div className="h-3 w-16 bg-surface-2 rounded" />
      </div>
      <div className="h-3 w-3/4 bg-surface-2 rounded mt-3" />
    </div>
  );
}

export default function WordsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [mastery, setMastery] = useState("all");
  const [sort, setSort] = useState("recent");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);

  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { words, total, loading, loadingMore, hasMore, error, refetch, loadMore, deleteWord, toggleFavorite } =
    useWords({ search: debouncedSearch, category, favorite: favoritesOnly, mastery, sort });

  async function handleDelete(word) {
    const ok = await confirm({
      title: `Delete "${word.word}"?`,
      message: "This removes the word and its practice history.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteWord(word._id);
      toast.success(`Removed "${word.word}"`);
    } catch {
      toast.error("Couldn't delete that word. Please try again.");
    }
  }

  async function handleToggleFav(id, val) {
    try {
      await toggleFavorite(id, val);
    } catch {
      toast.error("Couldn't update favourite.");
    }
  }

  async function exportWords() {
    try {
      const res = await fetch("/api/words?limit=0");
      const all = await res.json();
      if (!Array.isArray(all) || all.length === 0) return toast.info("No words to export.");
      const header = ["word", "category", "phonetic", "definition", "notes", "masteryLevel"];
      const rows = [header];
      all.forEach((w) =>
        rows.push([
          w.word,
          w.category,
          w.phonetic || "",
          w.meanings?.[0]?.definitions?.[0]?.definition || "",
          w.notes || "",
          w.masteryLevel || 0,
        ])
      );
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      download(csv, "voca-words.csv", "text/csv;charset=utf-8");
      toast.success(`Exported ${all.length} words`);
    } catch {
      toast.error("Export failed.");
    }
  }

  const noFilters = !debouncedSearch && category === "All" && !favoritesOnly && mastery === "all";

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20">
      {/* Hero */}
      <div className="pt-2 pb-6 border-b border-line flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label mb-2">My library</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-ink">
            {total} <span className="text-accent">{total === 1 ? "word" : "words"}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-ghost text-xs py-2.5 px-4" onClick={() => setShowImport(true)}>Import</button>
          <button className="btn-ghost text-xs py-2.5 px-4" onClick={exportWords}>Export</button>
          <button className="btn-primary flex items-center gap-2" onClick={() => { setEditing(null); setShowAdd(true); }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add word
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="py-5 border-b border-line space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <input type="text" placeholder="Search words…" className="input max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex gap-1.5 flex-wrap items-center">
            {ALL_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${category === c ? "bg-accent text-white border-accent" : "border-line text-muted hover:border-ink hover:text-ink"}`}>
                {c}
              </button>
            ))}
            <button onClick={() => setFavoritesOnly((v) => !v)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${favoritesOnly ? "bg-amber-400 text-black border-amber-400" : "border-line text-muted hover:border-amber-400 hover:text-amber-500"}`} title="Show favourites only">
              <svg className="w-3 h-3" fill={favoritesOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              Favourites
            </button>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex gap-1.5">
            {MASTERY_FILTERS.map((m) => (
              <button key={m.value} onClick={() => setMastery(m.value)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${mastery === m.value ? "bg-accent text-white border-accent" : "border-line text-muted hover:border-accent hover:text-ink"}`}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-faint">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-surface-2 text-ink text-xs border border-line rounded-full px-3 py-1.5 outline-none cursor-pointer hover:border-accent transition-colors">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

      {/* Word list */}
      <div className="pt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}</div>
        ) : words.length === 0 ? (
          <div className="text-center py-24">
            <p className="section-label mb-3">{favoritesOnly ? "No favourites" : "Empty shelf"}</p>
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{noFilters ? "No words yet" : "No matches"}</p>
            {noFilters && <button className="btn-primary mt-6" onClick={() => { setEditing(null); setShowAdd(true); }}>Add your first word</button>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2">
              {words.map((w) => (
                <WordCard key={w._id} word={w} onDelete={() => handleDelete(w)} onToggleFav={(val) => handleToggleFav(w._id, val)} onEdit={(word) => { setEditing(word); setShowAdd(true); }} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button onClick={loadMore} disabled={loadingMore} className="btn-ghost">
                  {loadingMore ? "Loading…" : `Load more (${total - words.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddWordModal editWord={editing} onClose={() => { setShowAdd(false); setEditing(null); }} onSaved={() => { setShowAdd(false); setEditing(null); refetch(); }} />
      )}
      {showImport && <BulkImportModal onClose={() => setShowImport(false)} onDone={refetch} />}
    </div>
  );
}
