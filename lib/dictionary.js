// Shared helper for the Free Dictionary API so the dictionary proxy and the
// word-of-the-day route return the exact same clean shape. Returns null on miss.
export async function fetchDictionary(word) {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    { next: { revalidate: 3600 } } // cache for 1 hour
  );
  if (!res.ok) return null;

  const data = await res.json();
  const entry = Array.isArray(data) ? data[0] : null;
  if (!entry) return null;

  return {
    word: entry.word,
    phonetic: entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || "",
    audioUrl: entry.phonetics?.find((p) => p.audio)?.audio || "",
    meanings: (entry.meanings || []).map((m) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions || []).slice(0, 3).map((d) => ({
        definition: d.definition,
        example: d.example || "",
        synonyms: d.synonyms?.slice(0, 5) || [],
        antonyms: d.antonyms?.slice(0, 5) || [],
      })),
    })),
  };
}
