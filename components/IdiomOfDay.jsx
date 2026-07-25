"use client";
import { useState, useEffect } from "react";
import { playWord } from "@/lib/audio";

// "Idiom of the day" card — mirrors WordOfDay. The idiom carries its own meaning
// and example; "Add to library" stores it as a Word with partOfSpeech "idiom".
export default function IdiomOfDay({ onAdded }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle"); // idle | loading | added | exists | error

  useEffect(() => {
    let ignore = false;
    fetch("/api/idiom-of-the-day")
      .then((r) => r.json())
      .then((d) => {
        if (ignore || !d?.idiom) return;
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
          word: data.idiom,
          meanings: [
            {
              partOfSpeech: "idiom",
              definitions: [{ definition: data.meaning, example: data.example }],
            },
          ],
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

  const btn = {
    idle: { label: "Add to library", cls: "btn-primary", disabled: false },
    loading: { label: "Adding…", cls: "btn-primary", disabled: true },
    added: { label: "Added ✓", cls: "btn-ghost", disabled: true },
    exists: { label: "In your library ✓", cls: "btn-ghost", disabled: true },
    error: { label: "Failed. Retry", cls: "btn-primary", disabled: false },
  }[status];

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Accent rail / label */}
        <div className="bg-accent/10 border-b md:border-b-0 md:border-r border-line px-6 py-5 md:w-56 flex md:flex-col items-center md:items-start justify-between gap-2 flex-shrink-0">
          <div>
            <p className="section-label text-accent">Idiom of the day</p>
            <p className="text-xs text-faint mt-1">
              {new Date(`${data.date}T00:00:00Z`).toLocaleDateString("en-US", {
                weekday: "long", month: "short", day: "numeric",
              })}
            </p>
          </div>
          <svg className="w-10 h-10 text-accent/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        {/* Idiom + meaning */}
        <div className="flex-1 px-6 py-5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink">&ldquo;{data.idiom}&rdquo;</h3>
            <button onClick={() => playWord(null, data.idiom)} className="text-accent hover:text-accent-hover transition-colors" title="Listen">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07" /></svg>
            </button>
            <span className="font-display text-sm text-muted italic">idiom</span>
          </div>

          <p className="text-sm text-muted mt-2 leading-relaxed">{data.meaning}</p>
          {data.example && <p className="font-display text-sm text-faint italic mt-1.5">&ldquo;{data.example}&rdquo;</p>}

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
