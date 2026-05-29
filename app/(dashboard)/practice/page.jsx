"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { schedule, isDue } from "@/lib/srs";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Smart order: most-overdue / new first, then weakest mastery. Shuffle first so
// equal-priority items vary between sessions.
function smartOrder(words) {
  return shuffle(words).sort((a, b) => {
    const ad = a.nextReview ? new Date(a.nextReview).getTime() : 0;
    const bd = b.nextReview ? new Date(b.nextReview).getTime() : 0;
    if (ad !== bd) return ad - bd;
    return (a.masteryLevel || 0) - (b.masteryLevel || 0);
  });
}

const MODES = [
  { key: "flashcard", title: "Flashcards", blurb: "Flip a card and self-grade your recall.", minWords: 1,
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg> },
  { key: "quiz", title: "Quiz", blurb: "Pick the right word from its definition.", minWords: 4,
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12" y2="17" /></svg> },
  { key: "spelling", title: "Spelling", blurb: "Type the word from its definition and audio.", minWords: 1,
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M4 7V5h16v2" /><path d="M9 19h6M12 5v14" /></svg> },
];

const defOf = (w) => w?.meanings?.[0]?.definitions?.[0]?.definition || "No definition available";
const posOf = (w) => w?.meanings?.[0]?.partOfSpeech || "";
function playAudio(url) {
  if (!url) return;
  const src = url.startsWith("//") ? `https:${url}` : url;
  try { new Audio(src).play().catch(() => {}); } catch {}
}

export default function PracticePage() {
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState("all"); // "all" | "due"
  const [mode, setMode] = useState(null);
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);

  const quizTimer = useRef(null);

  useEffect(() => {
    fetch("/api/words")
      .then((r) => r.json())
      .then((d) => setAllWords(Array.isArray(d) ? d : []))
      .catch(() => setAllWords([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => () => clearTimeout(quizTimer.current), []);

  const dueWords = useMemo(() => allWords.filter((w) => isDue(w)), [allWords]);

  const quizOptions = useMemo(() => {
    if (mode !== "quiz") return [];
    const pool = deck.map((w) => w.word);
    return deck.map((w) => {
      const distractors = shuffle(pool.filter((x) => x !== w.word)).slice(0, 3);
      return shuffle([w.word, ...distractors]);
    });
  }, [deck, mode]);

  function startMode(key) {
    const pool = scope === "due" ? dueWords : allWords;
    setMode(key);
    setDeck(smartOrder(pool));
    setIdx(0);
    setScore({ correct: 0, incorrect: 0 });
    setDone(false);
    setFlipped(false);
    setPicked(null);
    setTyped("");
    setChecked(false);
    setStartTime(Date.now());
  }

  function resetToModes() {
    clearTimeout(quizTimer.current);
    setMode(null);
    setDone(false);
  }

  async function persistWord(w, correct) {
    const { masteryLevel, nextReview } = schedule(w, correct);
    const patch = {
      practiceCount: (w.practiceCount || 0) + 1,
      correctCount: (w.correctCount || 0) + (correct ? 1 : 0),
      masteryLevel,
      nextReview: nextReview.toISOString(),
      lastPracticed: new Date().toISOString(),
    };
    // Update the master list only (drives due-count for the next session).
    // Deliberately NOT mutating `deck` mid-session — the running session doesn't
    // read these fields, and replacing the array reshuffles quiz options.
    setAllWords((prev) => prev.map((x) => (x._id === w._id ? { ...x, ...patch } : x)));
    try {
      await fetch(`/api/words/${w._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch { /* non-blocking */ }
  }

  async function finishSession(finalScore) {
    const total = finalScore.correct + finalScore.incorrect;
    const duration = Math.max(0, Math.min(10800, Math.round((Date.now() - startTime) / 1000)));
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          wordsReviewed: deck.map((w) => w._id),
          wordsCount: total,
          correctCount: finalScore.correct,
          duration,
        }),
      });
    } catch { /* non-blocking */ }
  }

  function record(correct) {
    const w = deck[idx];
    persistWord(w, correct);
    const nextScore = {
      correct: correct ? score.correct + 1 : score.correct,
      incorrect: correct ? score.incorrect : score.incorrect + 1,
    };
    setScore(nextScore);
    if (idx + 1 >= deck.length) {
      finishSession(nextScore);
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setFlipped(false);
    setPicked(null);
    setTyped("");
    setChecked(false);
  }

  function pickQuiz(opt) {
    if (picked !== null) return;
    setPicked(opt);
    clearTimeout(quizTimer.current);
    quizTimer.current = setTimeout(() => record(opt === deck[idx].word), 750);
  }

  // Keyboard shortcuts while practising.
  useEffect(() => {
    if (!mode || done) return;
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (mode === "flashcard") {
        if (!flipped && (e.code === "Space" || e.key === "Enter")) { e.preventDefault(); setFlipped(true); }
        else if (flipped && (e.key === "1" || e.key === "ArrowLeft")) { e.preventDefault(); record(false); }
        else if (flipped && (e.key === "2" || e.key === "ArrowRight")) { e.preventDefault(); record(true); }
      } else if (mode === "quiz" && picked === null) {
        const n = parseInt(e.key, 10);
        const opts = quizOptions[idx];
        if (opts && n >= 1 && n <= opts.length) { e.preventDefault(); pickQuiz(opts[n - 1]); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, done, flipped, picked, idx, score, quizOptions, deck]); // eslint-disable-line

  // ─── Loading ───
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );

  // ─── No words ───
  if (allWords.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="section-label">Nothing to practice</p>
        <p className="display text-[3rem] display-muted tracking-[0.05em]">ADD WORDS FIRST</p>
        <a href="/words" className="btn-primary mt-2">Go add words</a>
      </div>
    );

  // ─── Mode select ───
  if (!mode) {
    const pool = scope === "due" ? dueWords : allWords;
    return (
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="pt-10 pb-10 border-b border-line">
          <p className="section-label mb-2">Practice</p>
          <h1 className="display text-[7rem]">CHOOSE<br /><span className="display-muted">A MODE</span></h1>
        </div>

        {/* Scope toggle */}
        <div className="pt-8 flex items-center gap-2">
          <button
            onClick={() => setScope("all")}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${scope === "all" ? "bg-ink text-white border-ink" : "border-line text-muted hover:text-ink hover:border-ink"}`}
          >
            All words ({allWords.length})
          </button>
          <button
            onClick={() => setScope("due")}
            disabled={dueWords.length === 0}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${scope === "due" ? "bg-accent text-white border-accent" : "border-line text-muted hover:text-ink hover:border-accent"}`}
          >
            Due for review ({dueWords.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {MODES.map((m) => {
            const locked = pool.length < m.minWords;
            return (
              <button
                key={m.key}
                disabled={locked}
                onClick={() => startMode(m.key)}
                className="panel p-6 text-left hover:border-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                  {m.icon}
                </div>
                <p className="font-display text-2xl tracking-wide text-ink">{m.title}</p>
                <p className="text-sm text-muted mt-1">{m.blurb}</p>
                {locked && <p className="text-[11px] text-faint mt-3">Needs at least {m.minWords} {scope === "due" ? "due " : ""}words</p>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (done) {
    const total = score.correct + score.incorrect;
    const pct = total ? Math.round((score.correct / total) * 100) : 0;
    return (
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="pt-10 pb-10 border-b border-line">
          <p className="section-label mb-2">Session complete</p>
          <h1 className="display text-[7rem]">{pct}%<br /><span className="display-muted">ACCURACY</span></h1>
        </div>
        <div className="py-10 flex items-center gap-16 border-b border-line">
          <div>
            <p className="font-display text-[4rem] leading-none text-accent">{score.correct}</p>
            <p className="section-label mt-1">Correct</p>
          </div>
          <div className="w-px h-14 bg-line" />
          <div>
            <p className="font-display text-[4rem] leading-none display-muted">{score.incorrect}</p>
            <p className="section-label mt-1">Incorrect</p>
          </div>
        </div>
        <div className="pt-8 flex gap-3 flex-wrap">
          <button onClick={() => startMode(mode)} className="btn-primary">Practice again</button>
          <button onClick={resetToModes} className="btn-ghost">Change mode</button>
          <a href="/statistics" className="btn-ghost">View stats</a>
        </div>
      </div>
    );
  }

  const w = deck[idx];
  const progress = ((idx + 1) / deck.length) * 100;

  return (
    <div className="max-w-5xl mx-auto px-6 pb-20">
      <div className="pt-10 pb-8 border-b border-line flex items-end justify-between">
        <div>
          <p className="section-label mb-2">{MODES.find((m) => m.key === mode)?.title}{scope === "due" ? " · review" : ""}</p>
          <p className="text-sm text-faint font-medium">{idx + 1} of {deck.length}</p>
        </div>
        <button onClick={resetToModes} className="text-xs text-muted hover:text-ink transition-colors">Exit</button>
      </div>

      <div className="mt-6 h-0.5 bg-line rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Flashcard */}
      {mode === "flashcard" && (
        <>
          <div className="mt-10 panel p-14 text-center cursor-pointer hover:border-line-strong transition-all min-h-64 flex flex-col items-center justify-center" onClick={() => setFlipped(!flipped)}>
            {!flipped ? (
              <>
                <p className="font-display text-[5rem] leading-none tracking-[0.03em] text-ink uppercase">{w.word}</p>
                {w.phonetic && <p className="text-faint text-sm mt-2">{w.phonetic}</p>}
                <p className="section-label mt-8">Tap or press Space to reveal</p>
              </>
            ) : (
              <>
                {posOf(w) && <p className="section-label mb-4 text-accent">{posOf(w)}</p>}
                <p className="text-lg text-ink/80 leading-relaxed max-w-md">{defOf(w)}</p>
                {w.meanings?.[0]?.definitions?.[0]?.example && (
                  <p className="text-sm text-faint italic mt-4">&ldquo;{w.meanings[0].definitions[0].example}&rdquo;</p>
                )}
              </>
            )}
          </div>
          {flipped && (
            <>
              <div className="flex gap-3 mt-6 max-w-sm mx-auto">
                <button onClick={() => record(false)} className="flex-1 py-3 rounded-full border-2 border-line text-muted text-sm font-semibold hover:border-ink hover:text-ink transition-colors">Didn&apos;t know</button>
                <button onClick={() => record(true)} className="flex-1 py-3 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">Knew it!</button>
              </div>
              <p className="text-[10px] text-faint text-center mt-3">Keys: 1 / ← didn&apos;t know · 2 / → knew it</p>
            </>
          )}
        </>
      )}

      {/* Quiz */}
      {mode === "quiz" && (
        <>
          <div className="mt-10 panel p-10 text-center min-h-48 flex flex-col items-center justify-center">
            {posOf(w) && <p className="section-label mb-3 text-accent">{posOf(w)}</p>}
            <p className="text-xl text-ink leading-relaxed max-w-lg">{defOf(w)}</p>
            <p className="section-label mt-6">Which word is this?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 max-w-xl mx-auto">
            {quizOptions[idx]?.map((opt, i) => {
              const isCorrect = opt === w.word;
              const reveal = picked !== null;
              let cls = "border-line text-ink hover:border-accent";
              if (reveal && isCorrect) cls = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
              else if (reveal && opt === picked) cls = "border-red-500 bg-red-500/10 text-red-500";
              else if (reveal) cls = "border-line text-faint";
              return (
                <button key={opt} disabled={reveal} onClick={() => pickQuiz(opt)} className={`py-3.5 px-4 rounded-xl border-2 text-sm font-semibold capitalize transition-all flex items-center gap-2 ${cls}`}>
                  <span className="text-[10px] text-faint font-bold">{i + 1}</span>{opt}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-faint text-center mt-3">Press 1–4 to answer</p>
        </>
      )}

      {/* Spelling */}
      {mode === "spelling" && (
        <>
          <div className="mt-10 panel p-10 text-center min-h-48 flex flex-col items-center justify-center">
            {posOf(w) && <p className="section-label mb-3 text-accent">{posOf(w)}</p>}
            <p className="text-xl text-ink leading-relaxed max-w-lg">{defOf(w)}</p>
            {w.audioUrl && (
              <button onClick={() => playAudio(w.audioUrl)} className="mt-5 inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07" /></svg>
                Play pronunciation
              </button>
            )}
          </div>
          <form
            className="mt-6 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              if (checked) record(typed.trim().toLowerCase() === w.word.toLowerCase());
              else setChecked(true);
            }}
          >
            <input autoFocus type="text" value={typed} disabled={checked} onChange={(e) => setTyped(e.target.value)} placeholder="Type the word…" className="input text-center text-lg disabled:opacity-80" autoComplete="off" autoCorrect="off" spellCheck={false} />
            {checked && (
              <p className={`text-center mt-3 text-sm font-semibold ${typed.trim().toLowerCase() === w.word.toLowerCase() ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                {typed.trim().toLowerCase() === w.word.toLowerCase() ? "Correct!" : <>Answer: <span className="capitalize">{w.word}</span></>}
              </p>
            )}
            <button type="submit" className="btn-primary w-full mt-4">{checked ? "Next" : "Check"}</button>
          </form>
        </>
      )}
    </div>
  );
}
