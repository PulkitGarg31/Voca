"use client";
import { useState, useRef, useEffect } from "react";

const norm = (s) => String(s || "").trim().toLowerCase().replace(/[^a-z\s']/g, "");

// Browser speech-recognition for pronunciation checks. Each component instance
// gets its own recognizer + state. Call `listen(target)` to record once and
// compare the transcript to `target` (case/punctuation-insensitive, accepting any
// of the recognizer's alternatives, and a match on any single word in a phrase).
// `supported` is resolved after mount to avoid SSR/hydration mismatch.
export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null); // { heard, correct } | null
  const recRef = useRef(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  // Abort any in-flight recognition when the component unmounts.
  useEffect(() => () => { try { recRef.current?.abort(); } catch {} }, []);

  function reset() {
    setResult(null);
  }

  function listen(target) {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR || listening) return;
    const want = norm(target);
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.onresult = (e) => {
      const alts = Array.from(e.results[0] || []).map((r) => norm(r.transcript));
      const correct = alts.some((a) => a === want || a.split(/\s+/).includes(want));
      setResult({ heard: alts[0] || "", correct });
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setResult(null);
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  return { supported, listening, result, listen, reset };
}
