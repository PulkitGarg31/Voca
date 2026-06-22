// Lightweight spaced-repetition (Leitner-style) scheduling.
// Interval in days keyed by mastery level (0..5). Higher mastery → seen less often.
const INTERVALS_DAYS = [0, 1, 2, 4, 7, 14];

// How each flashcard grade moves the mastery level.
//  again → got it wrong, drop a level     hard → barely, stay put
//  good  → normal, advance one level       easy → advance two
const GRADE_DELTA = { again: -1, hard: 0, good: 1, easy: 2 };

// Normalize an answer (boolean for quiz/spelling/pronunciation, or a named grade
// for flashcards) into a mastery delta.
function deltaFor(answer) {
  if (typeof answer === "boolean") return answer ? 1 : -1;
  return GRADE_DELTA[answer] ?? 1;
}

// Was this answer "correct" for scoring purposes? Only "again"/false count as wrong.
export function isCorrectAnswer(answer) {
  if (typeof answer === "boolean") return answer;
  return answer !== "again";
}

// Compute the next mastery level + next review date from an answer.
// `answer` may be a boolean (correct/incorrect) or a grade ("again"|"hard"|"good"|"easy").
export function schedule(prev, answer) {
  const mastery = Math.max(0, Math.min(5, prev?.masteryLevel || 0));
  const nextMastery = Math.max(0, Math.min(5, mastery + deltaFor(answer)));
  const days = INTERVALS_DAYS[nextMastery];
  const nextReview = new Date(Date.now() + days * 86400000);
  return { masteryLevel: nextMastery, nextReview };
}

// A word is "due" if it has never been scheduled or its review date has passed.
export function isDue(word, now = Date.now()) {
  if (!word?.nextReview) return true;
  return new Date(word.nextReview).getTime() <= now;
}
