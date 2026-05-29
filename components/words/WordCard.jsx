"use client";
import { useState } from "react";
import { catStyle } from "@/lib/categories";
import FormattedText from "@/components/FormattedText";

function playAudio(url) {
  if (!url) return;
  const src = url.startsWith("//") ? `https:${url}` : url;
  try {
    new Audio(src).play().catch(() => {});
  } catch {}
}

export default function WordCard({ word, onDelete, onToggleFav, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [ai, setAi] = useState({ loading: false, text: "", error: "" });
  const def = word.meanings?.[0]?.definitions?.[0];
  const pos = word.meanings?.[0]?.partOfSpeech;
  const cat = catStyle(word.category);

  async function getAiHelp() {
    if (ai.loading || ai.text) return;
    setAi({ loading: true, text: "", error: "" });
    try {
      const res = await fetch("/api/ai/word-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.word }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setAi({ loading: false, text: data.text, error: "" });
    } catch (err) {
      setAi({ loading: false, text: "", error: err.message });
    }
  }

  return (
    <div className="word-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-ink capitalize">{word.word}</h3>
            {word.phonetic && <span className="text-xs text-faint">{word.phonetic}</span>}
            {pos && <span className="text-[10px] text-faint italic">{pos}</span>}
            <span className={`badge ${cat.badge}`}>{word.category}</span>
            {word.masteryLevel > 0 && (
              <span className="badge bg-accent/15 text-accent" title="Mastery level">
                {"★".repeat(word.masteryLevel)}
              </span>
            )}
          </div>

          {def && <p className="text-xs text-muted mt-1 line-clamp-2">{def.definition}</p>}

          {expanded && (
            <div className="mt-3 space-y-2 text-xs">
              {word.meanings?.map((m, mi) => (
                <div key={mi}>
                  <p className="text-faint italic mb-1">{m.partOfSpeech}</p>
                  {m.definitions?.map((d, di) => (
                    <div key={di} className="mb-2 pl-2 border-l-2 border-accent/30">
                      <p className="text-ink/80">{d.definition}</p>
                      {d.example && <p className="text-faint mt-0.5 italic">&ldquo;{d.example}&rdquo;</p>}
                      {d.synonyms?.length > 0 && (
                        <p className="text-faint mt-0.5">
                          Synonyms: <span className="text-accent">{d.synonyms.join(", ")}</span>
                        </p>
                      )}
                      {d.antonyms?.length > 0 && (
                        <p className="text-faint mt-0.5">
                          Antonyms: <span className="text-ink/70">{d.antonyms.join(", ")}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {word.notes && (
                <div className="bg-surface-2 rounded-lg p-2 text-muted">
                  <strong className="text-ink">Note:</strong> {word.notes}
                </div>
              )}

              {/* AI examples + mnemonic */}
              <div>
                {!ai.text && !ai.loading && (
                  <button onClick={getAiHelp} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:text-accent-hover transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /></svg>
                    AI examples &amp; memory trick
                  </button>
                )}
                {ai.loading && (
                  <div className="flex items-center gap-2 text-faint text-[11px]">
                    <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </div>
                )}
                {ai.error && <p className="text-[11px] text-red-500">{ai.error}</p>}
                {ai.text && (
                  <FormattedText text={ai.text} className="text-xs text-ink/80 bg-accent/5 border border-accent/15 rounded-lg p-3 leading-relaxed" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {word.audioUrl && (
            <button
              onClick={() => playAudio(word.audioUrl)}
              className="p-1.5 rounded-lg hover:bg-surface-2 text-faint hover:text-ink transition-colors"
              title="Play pronunciation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onToggleFav(!word.isFavorite)}
            className={`p-1.5 rounded-lg hover:bg-surface-2 transition-colors ${word.isFavorite ? "text-amber-400" : "text-faint hover:text-amber-400"}`}
            title="Toggle favourite"
          >
            <svg className="w-4 h-4" fill={word.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(word)}
              className="p-1.5 rounded-lg hover:bg-surface-2 text-faint hover:text-ink transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-surface-2 text-faint hover:text-ink transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-faint hover:text-red-500 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
