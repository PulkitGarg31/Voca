"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { schedule, isDue, isCorrectAnswer } from "@/lib/srs";
import { playWord } from "@/lib/audio";

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

const SpeakerIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07" />
  </svg>
);

const MicIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MODES = [
  { key: "flashcard", title: "Flashcards", blurb: "Flip a card and grade your recall.", minWords: 1,
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg> },
  { key: "quiz", title: "Quiz", blurb: "Pick the right word from its definition.", minWords: 4,
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12" y2="17" /></svg> },
  { key: "spelling", title: "Spelling", blurb: "Type the word from its definition and audio.", minWords: 1,
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M4 7V5h16v2" /><path d="M9 19h6M12 5v14" /></svg> },
  { key: "pronunciation", title: "Pronunciation", blurb: "Read the meaning, then say the word out loud.", minWords: 1,
    icon: <MicIcon className="w-6 h-6" /> },
];

const defOf = (w) => w?.meanings?.[0]?.definitions?.[0]?.definition || "No definition available";
const posOf = (w) => w?.meanings?.[0]?.partOfSpeech || "";
const norm = (s) => String(s || "").trim().toLowerCase().replace(/[^a-z\s']/g, "");

export default function PracticePage() {
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState("all"); // "all" | "due"
  const [mode, setMode] = useState(null);
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [done, setDone] = useState(false);
  const [wrongWords, setWrongWords] = useState([]);

  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);

  // Pronunciation mode
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [heard, setHeard] = useState("");
  const [pronCorrect, setPronCorrect] = useState(false);

  const quizTimer = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetch("/api/words")
      .then((r) => r.json())
      .then((d) => setAllWords(Array.isArray(d) ? d : []))
      .catch(() => setAllWords([]))
      .finally(() => setLoading(false));
  }, []);

  // Detect speech recognition after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  useEffect(() => () => {
    clearTimeout(quizTimer.current);
    try { recognitionRef.current?.abort(); } catch {}
  }, []);

  const dueWords = useMemo(() => allWords.filter((w) => isDue(w)), [allWords]);

  const quizOptions = useMemo(() => {
    if (mode !== "quiz") return [];
    const pool = deck.map((w) => w.word);
    return deck.map((w) => {
      const distractors = shuffle(pool.filter((x) => x !== w.word)).slice(0, 3);
      return shuffle([w.word, ...distractors]);
    });
  }, [deck, mode]);

  function resetTurnState() {
    setFlipped(false);
    setPicked(null);
    setTyped("");
    setChecked(false);
    setHeard("");
    setRecording(false);
    setPronCorrect(false);
  }

  function startMode(key, customPool = null) {
    try { recognitionRef.current?.abort(); } catch {}
    const pool = customPool || (scope === "due" ? dueWords : allWords);
    setMode(key);
    setDeck(smartOrder(pool));
    setIdx(0);
    setScore({ correct: 0, incorrect: 0 });
    setWrongWords([]);
    setDone(false);
    resetTurnState();
  }

  function resetToModes() {
    clearTimeout(quizTimer.current);
    try { recognitionRef.current?.abort(); } catch {}
    setMode(null);
    setDone(false);
  }

  async function persistWord(w, answer) {
    const { masteryLevel, nextReview } = schedule(w, answer);
    const correct = isCorrectAnswer(answer);
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
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          wordsReviewed: deck.map((w) => w._id),
          wordsCount: total,
          correctCount: finalScore.correct,
        }),
      });
    } catch { /* non-blocking */ }
  }

  // `answer`: boolean (quiz/spelling/pronunciation) or grade string (flashcard).
  function record(answer) {
    const w = deck[idx];
    const correct = isCorrectAnswer(answer);
    persistWord(w, answer);
    if (!correct) {
      setWrongWords((prev) => (prev.some((x) => x._id === w._id) ? prev : [...prev, w]));
    }
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
    resetTurnState();
  }

  function pickQuiz(opt) {
    if (picked !== null) return;
    setPicked(opt);
    const current = deck[idx];
    // Lock correctness to the current card now, so the delayed record() can't
    // read a stale idx if state changes before the timer fires.
    const wasCorrect = opt === current.word;
    // Speak the correct word as audio reinforcement on reveal.
    playWord(current.audioUrl, current.word);
    clearTimeout(quizTimer.current);
    quizTimer.current = setTimeout(() => record(wasCorrect), 1100);
  }

  function startPronunciation() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || recording) return;
    const target = norm(deck[idx].word);
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.onresult = (e) => {
      const alts = Array.from(e.results[0] || []).map((r) => norm(r.transcript));
      setHeard(alts[0] || "");
      const ok = alts.some((a) => a === target || a.split(/\s+/).includes(target));
      setPronCorrect(ok);
      setChecked(true);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    setHeard("");
    setChecked(false);
    setPronCorrect(false);
    setRecording(true);
    try { rec.start(); } catch { setRecording(false); }
  }

  // Keyboard shortcuts while practising.
  useEffect(() => {
    if (!mode || done) return;
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (mode === "flashcard") {
        if (!flipped && (e.code === "Space" || e.key === "Enter")) { e.preventDefault(); setFlipped(true); }
        else if (flipped) {
          const grades = { 1: "again", 2: "hard", 3: "good", 4: "easy" };
          if (grades[e.key]) { e.preventDefault(); record(grades[e.key]); }
        }
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
        <p className="font-display text-3xl font-extrabold tracking-tight text-ink">Add words first</p>
        <a href="/words" className="btn-primary mt-2">Go add words</a>
      </div>
    );

  // ─── Mode select ───
  if (!mode) {
    const pool = scope === "due" ? dueWords : allWords;
    const modes = MODES.filter((m) => m.key !== "pronunciation" || speechSupported);
    return (
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="pt-10 pb-10 border-b border-line">
          <p className="section-label mb-2">Practice</p>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-ink">Choose a mode</h1>
        </div>

        {/* Scope toggle */}
        <div className="pt-8 flex items-center gap-2">
          <button
            onClick={() => setScope("all")}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${scope === "all" ? "bg-accent text-[rgb(var(--on-primary))] border-accent" : "border-line text-muted hover:text-ink hover:border-ink"}`}
          >
            All words ({allWords.length})
          </button>
          <button
            onClick={() => setScope("due")}
            disabled={dueWords.length === 0}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${scope === "due" ? "bg-accent text-[rgb(var(--on-primary))] border-accent" : "border-line text-muted hover:text-ink hover:border-accent"}`}
          >
            Due for review ({dueWords.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          {modes.map((m) => {
            const locked = pool.length < m.minWords;
            return (
              <button
                key={m.key}
                disabled={locked}
                onClick={() => startMode(m.key)}
                className="panel p-6 text-left hover:border-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-[rgb(var(--on-primary))] transition-colors">
                  {m.icon}
                </div>
                <p className="font-display text-2xl font-bold tracking-tight text-ink">{m.title}</p>
                <p className="text-sm text-muted mt-1">{m.blurb}</p>
                {locked && <p className="text-[11px] text-faint mt-3">Needs at least {m.minWords} {scope === "due" ? "due " : ""}words</p>}
              </button>
            );
          })}
        </div>
        {!speechSupported && (
          <p className="text-[11px] text-faint mt-4">Tip: the Pronunciation mode needs a browser with speech recognition (Chrome, Edge, or Safari).</p>
        )}
      </div>
    );
  }

  // ─── Done ───
  if (done) {
    const total = score.correct + score.incorrect;
    const pct = total ? Math.round((score.correct / total) * 100) : 0;
    const missed = wrongWords.length;
    return (
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="pt-10 pb-10 border-b border-line">
          <p className="section-label mb-2">Session complete</p>
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-accent">{pct}%</h1>
            <span className="font-display text-2xl font-bold tracking-tight text-muted">accuracy</span>
          </div>
        </div>
        <div className="py-10 flex items-center gap-16 border-b border-line">
          <div>
            <p className="font-display text-6xl font-extrabold leading-none text-accent">{score.correct}</p>
            <p className="section-label mt-1">Correct</p>
          </div>
          <div className="w-px h-14 bg-line" />
          <div>
            <p className="font-display text-6xl font-extrabold leading-none display-muted">{score.incorrect}</p>
            <p className="section-label mt-1">Incorrect</p>
          </div>
        </div>
        <div className="pt-8 flex gap-3 flex-wrap">
          {missed > 0 && (
            <button onClick={() => startMode(mode, wrongWords)} className="btn-primary">
              Practice the {missed} you missed
            </button>
          )}
          <button onClick={() => startMode(mode)} className={missed > 0 ? "btn-ghost" : "btn-primary"}>Practice again</button>
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
          <p className="text-sm text-faint font-medium">
            {idx + 1} of {deck.length}
            {(score.correct > 0 || score.incorrect > 0) && (
              <> · <span className="text-emerald-600 dark:text-emerald-400">{score.correct} ✓</span> <span className="text-red-500">{score.incorrect} ✗</span></>
            )}
          </p>
        </div>
        <button onClick={resetToModes} className="text-xs text-muted hover:text-ink transition-colors">Exit</button>
      </div>

      <div className="mt-6 h-1.5 bg-line rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Flashcard */}
      {mode === "flashcard" && (
        <>
          <div className="mt-10 panel p-14 text-center cursor-pointer hover:border-line-strong transition-all min-h-64 flex flex-col items-center justify-center" onClick={() => setFlipped(!flipped)}>
            {!flipped ? (
              <>
                <p className="font-display text-6xl font-extrabold leading-none tracking-tight text-ink uppercase">{w.word}</p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  {w.phonetic && <p className="text-faint text-sm">{w.phonetic}</p>}
                  <button
                    onClick={(e) => { e.stopPropagation(); playWord(w.audioUrl, w.word); }}
                    className="text-accent hover:text-accent-hover transition-colors"
                    title="Listen"
                  >
                    <SpeakerIcon className="w-4 h-4" />
                  </button>
                </div>
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
              <div className="grid grid-cols-4 gap-2 mt-6 max-w-lg mx-auto">
                <button onClick={() => record("again")} className="py-3 rounded-xl border-2 border-red-500/40 text-red-500 text-sm font-semibold hover:bg-red-500/10 transition-colors">Again</button>
                <button onClick={() => record("hard")} className="py-3 rounded-xl border-2 border-amber-500/40 text-amber-600 dark:text-amber-400 text-sm font-semibold hover:bg-amber-500/10 transition-colors">Hard</button>
                <button onClick={() => record("good")} className="py-3 rounded-xl border-2 border-line text-ink text-sm font-semibold hover:border-accent transition-colors">Good</button>
                <button onClick={() => record("easy")} className="py-3 rounded-xl border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-500/10 transition-colors">Easy</button>
              </div>
              <p className="text-[10px] text-faint text-center mt-3">Keys: 1 Again · 2 Hard · 3 Good · 4 Easy</p>
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
            <button onClick={() => playWord(w.audioUrl, w.word)} className="mt-5 inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors">
              <SpeakerIcon className="w-4 h-4" />
              Play pronunciation
            </button>
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

      {/* Pronunciation */}
      {mode === "pronunciation" && (
        <>
          <div className="mt-10 panel p-10 text-center min-h-48 flex flex-col items-center justify-center">
            {posOf(w) && <p className="section-label mb-3 text-accent">{posOf(w)}</p>}
            <p className="text-xl text-ink leading-relaxed max-w-lg">{defOf(w)}</p>
            {!checked ? (
              <>
                <p className="section-label mt-6">Say the word out loud</p>
                <button
                  onClick={startPronunciation}
                  disabled={recording}
                  className={`mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${recording ? "bg-red-500/10 text-red-500 border-2 border-red-500 animate-pulse" : "btn-primary"}`}
                >
                  <MicIcon className="w-4 h-4" />
                  {recording ? "Listening…" : "Record & speak"}
                </button>
              </>
            ) : (
              <div className="mt-6">
                <p className={`text-sm font-semibold ${pronCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  {pronCorrect ? "Correct! 🎉" : <>Answer: <span className="capitalize">{w.word}</span></>}
                </p>
                {heard && <p className="text-xs text-faint mt-1">Heard: &ldquo;{heard}&rdquo;</p>}
                <button onClick={() => playWord(w.audioUrl, w.word)} className="mt-3 inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors">
                  <SpeakerIcon className="w-4 h-4" /> Hear it
                </button>
              </div>
            )}
          </div>
          {checked && (
            <div className="mt-6 max-w-md mx-auto">
              <button onClick={() => record(pronCorrect)} className="btn-primary w-full">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
