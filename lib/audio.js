// Shared word-pronunciation helper.
//
// Plays the dictionary-provided audio URL when one exists; otherwise (or if that
// file fails to load) falls back to the browser's built-in speech synthesis so
// EVERY word has a working "listen" button — even ones the dictionary API had no
// audio for, or words added manually/in bulk without a lookup.

// Speak `text` via the Web Speech API. Returns false when unsupported.
export function speak(text) {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    // Cancel anything mid-utterance so rapid taps don't queue up.
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

// Play a word's pronunciation: prefer the recorded audio URL, fall back to TTS.
export function playWord(audioUrl, text) {
  if (!audioUrl) {
    speak(text);
    return;
  }
  const src = audioUrl.startsWith("//") ? `https:${audioUrl}` : audioUrl;
  // The "error" event and the play() promise rejection can both fire for one
  // failure — guard so we only ever fall back to synthesis once.
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    speak(text);
  };
  try {
    const audio = new Audio(src);
    audio.addEventListener("error", fallback, { once: true });
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(fallback);
  } catch {
    fallback();
  }
}
