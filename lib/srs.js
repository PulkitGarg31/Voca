// Lightweight spaced-repetition (Leitner-style) scheduling.
// Interval in days keyed by mastery level (0..5). Higher mastery → seen less often.
const INTERVALS_DAYS = [0, 1, 2, 4, 7, 14];

// Compute the next mastery level + next review date from an answer.
export function schedule(prev, correct) {
  const mastery = Math.max(0, Math.min(5, prev?.masteryLevel || 0));
  const nextMastery = correct ? Math.min(5, mastery + 1) : Math.max(0, mastery - 1);
  const days = INTERVALS_DAYS[nextMastery];
  const nextReview = new Date(Date.now() + days * 86400000);
  return { masteryLevel: nextMastery, nextReview };
}

// A word is "due" if it has never been scheduled or its review date has passed.
export function isDue(word, now = Date.now()) {
  if (!word?.nextReview) return true;
  return new Date(word.nextReview).getTime() <= now;
}
