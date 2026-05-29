// Curated list of strong vocabulary words for the "Word of the Day".
// Selection is deterministic by UTC day, so everyone sees the same word on a
// given day and it stays stable across refreshes, rotating at UTC midnight.
export const WORD_OF_DAY_LIST = [
  "aberration", "acumen", "alacrity", "ambivalent", "anomaly", "antithesis",
  "aplomb", "arduous", "articulate", "ascetic", "assiduous", "austere",
  "benevolent", "bombastic", "brevity", "cacophony", "capricious", "censure",
  "circumspect", "clandestine", "cogent", "conundrum", "copious", "cryptic",
  "deference", "deleterious", "demure", "denigrate", "didactic", "diffident",
  "disparate", "dogmatic", "ebullient", "eclectic", "effervescent", "egregious",
  "eloquent", "elucidate", "enervate", "ennui", "ephemeral", "epitome",
  "equanimity", "erudite", "esoteric", "ethereal", "evanescent", "exacerbate",
  "fastidious", "fervent", "flagrant", "fortuitous", "garrulous", "gregarious",
  "hackneyed", "halcyon", "harbinger", "iconoclast", "idiosyncrasy", "impetuous",
  "inchoate", "ineffable", "ingenuous", "insidious", "intransigent", "juxtaposition",
  "laconic", "languid", "largesse", "lethargic", "loquacious", "lucid",
  "magnanimous", "malleable", "maverick", "mellifluous", "mercurial", "meticulous",
  "mitigate", "mollify", "myriad", "nadir", "nebulous", "nefarious",
  "nonchalant", "nostalgia", "obfuscate", "obsequious", "ominous", "ostentatious",
  "paradigm", "paragon", "penchant", "perfunctory", "pernicious", "perspicacious",
  "petulant", "phlegmatic", "placate", "plethora", "pragmatic", "precocious",
  "prescient", "pristine", "prosaic", "quintessential", "quixotic", "recalcitrant",
  "reticent", "resilient", "sagacious", "salient", "sanguine", "serendipity",
  "soporific", "spurious", "stoic", "succinct", "surreptitious", "sycophant",
  "taciturn", "tenuous", "trepidation", "ubiquitous", "vacillate", "venerable",
  "verbose", "vicarious", "vindicate", "voracious", "zealous", "zenith",
];

// Days since the Unix epoch in UTC — stable for the whole UTC calendar day.
function utcDayNumber(date) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000
  );
}

export function getWordForDate(date = new Date()) {
  const idx = utcDayNumber(date) % WORD_OF_DAY_LIST.length;
  return WORD_OF_DAY_LIST[idx];
}
