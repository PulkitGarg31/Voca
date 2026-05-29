"use client";
import { useState, useEffect } from "react";

function playAudio(url) {
  if (!url) return;
  const src = url.startsWith("//") ? `https:${url}` : url;
  try {
    new Audio(src).play().catch(() => {});
  } catch {}
}

export default function WordOfDay({ onAdded }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle"); // idle | loading | added | exists | error

  useEffect(() => {
    let ignore = false;
    fetch("/api/word-of-the-day")
      .then((r) => r.json())
      .then((d) => {
        if (ignore || !d?.word) return;
        setData(d);
        if (d.alreadyAdded) setStatus("exists");
      })
      .catch(() => {})
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, []);

  async function add() {
    if (status === "loading" || status === "added" || status === "exists") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: data.word,
          phonetic: data.details?.phonetic || "",
          audioUrl: data.details?.audioUrl || "",
          meanings: data.details?.meanings || [],
          category: "Other",
        }),
      });
      if (res.status === 409) { setStatus("exists"); return; }
      if (!res.ok) { setStatus("error"); return; }
      setStatus("added");
      onAdded?.();
    } catch {
      setStatus("error");
    }
  }

  if (loading)
    return (
      <div className="panel p-6 flex items-center justify-center min-h-[8rem]">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!data) return null; // failed to load — quietly omit the card

  const def = data.details?.meanings?.[0]?.definitions?.[0];
  const pos = data.details?.meanings?.[0]?.partOfSpeech;

  const btn = {
    idle: { label: "Add to library", cls: "btn-primary", disabled: false },
    loading: { label: "Adding…", cls: "btn-primary", disabled: true },
    added: { label: "Added ✓", cls: "btn-ghost", disabled: true },
    exists: { label: "In your library ✓", cls: "btn-ghost", disabled: true },
    error: { label: "Failed — retry", cls: "btn-primary", disabled: false },
  }[status];

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Accent rail / label */}
        <div className="bg-accent/10 px-6 py-5 md:w-56 flex md:flex-col items-center md:items-start justify-between gap-2 flex-shrink-0">
          <div>
            <p className="section-label text-accent">Word of the day</p>
            <p className="text-xs text-faint mt-1">
              {new Date(`${data.date}T00:00:00Z`).toLocaleDateString("en-US", {
                weekday: "long", month: "short", day: "numeric",
              })}
            </p>
          </div>
          <svg className="w-10 h-10 text-accent/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
        </div>

        {/* Word + definition */}
        <div className="flex-1 px-6 py-5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-[2.75rem] leading-none tracking-wide text-ink capitalize">{data.word}</h3>
            {data.details?.phonetic && <span className="text-sm text-faint">{data.details.phonetic}</span>}
            {data.details?.audioUrl && (
              <button onClick={() => playAudio(data.details.audioUrl)} className="text-accent hover:text-accent-hover transition-colors" title="Play pronunciation">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07" /></svg>
              </button>
            )}
            {pos && <span className="text-xs text-faint italic">{pos}</span>}
          </div>

          {def ? (
            <>
              <p className="text-sm text-ink/80 mt-2 leading-relaxed">{def.definition}</p>
              {def.example && <p className="text-xs text-faint italic mt-1">&ldquo;{def.example}&rdquo;</p>}
            </>
          ) : (
            <p className="text-sm text-faint mt-2">Definition unavailable right now — add it and look it up later.</p>
          )}

          <div className="mt-4">
            <button onClick={add} disabled={btn.disabled} className={`${btn.cls} text-xs py-2 px-5`}>
              {btn.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
