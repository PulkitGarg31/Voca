import { useState } from "react";

export function useDictionary() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function lookup(word) {
    if (!word?.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res  = await fetch(`/api/dictionary?word=${encodeURIComponent(word.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Word not found");
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { result, loading, error, lookup, reset };
}
