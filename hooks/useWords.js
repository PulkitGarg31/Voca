import { useState, useEffect, useCallback } from "react";

export function useWords({
  search = "",
  category = "All",
  favorite = false,
  mastery = "all",
  sort = "recent",
  pageSize = 24,
} = {}) {
  const [words, setWords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const buildParams = useCallback(
    (skipVal) => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (category !== "All") p.set("category", category);
      if (favorite) p.set("favorite", "true");
      if (mastery && mastery !== "all") p.set("mastery", mastery);
      if (sort) p.set("sort", sort);
      p.set("limit", String(pageSize));
      p.set("skip", String(skipVal));
      return p;
    },
    [search, category, favorite, mastery, sort, pageSize]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/words?${buildParams(0)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      const list = Array.isArray(data) ? data : [];
      setWords(list);
      setTotal(Number(res.headers.get("X-Total-Count")) || list.length);
    } catch (err) {
      setError(err.message);
      setWords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      // Offset from what we currently hold, so an optimistic delete can't make
      // us skip a row (a separate counter would drift out of sync).
      const res = await fetch(`/api/words?${buildParams(words.length)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // De-dupe defensively in case the list shifted between fetches.
        setWords((prev) => {
          const seen = new Set(prev.map((w) => w._id));
          return [...prev, ...data.filter((w) => !seen.has(w._id))];
        });
        setTotal(Number(res.headers.get("X-Total-Count")) || total);
      }
    } catch {
      /* ignore — user can retry */
    } finally {
      setLoadingMore(false);
    }
  }

  // Optimistic delete with rollback.
  async function deleteWord(id) {
    const snapshot = words;
    const snapTotal = total;
    setWords((prev) => prev.filter((w) => w._id !== id));
    setTotal((t) => Math.max(0, t - 1));
    try {
      const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
      setWords(snapshot);
      setTotal(snapTotal);
      throw err;
    }
  }

  // Optimistic update with rollback.
  async function updateWord(id, patch) {
    const snapshot = words;
    setWords((prev) => prev.map((w) => (w._id === id ? { ...w, ...patch } : w)));
    try {
      const res = await fetch(`/api/words/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setWords((prev) => prev.map((w) => (w._id === id ? data : w)));
      return data;
    } catch (err) {
      setWords(snapshot);
      throw err;
    }
  }

  function toggleFavorite(id, value) {
    return updateWord(id, { isFavorite: value });
  }

  return {
    words,
    total,
    loading,
    loadingMore,
    error,
    hasMore: words.length < total,
    reload,
    refetch: reload,
    loadMore,
    deleteWord,
    updateWord,
    toggleFavorite,
  };
}
