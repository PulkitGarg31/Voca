// Curated list of common English idioms for the "Idiom of the Day".
// Mirrors lib/wordOfDay.js: selection is deterministic by UTC day, so everyone
// sees the same idiom on a given day and it stays stable across refreshes,
// rotating at UTC midnight. Each entry carries its own meaning + example, so —
// unlike words — no external dictionary lookup is needed (dictionary APIs don't
// cover multi-word idioms reliably).
export const IDIOM_OF_DAY_LIST = [
  { idiom: "A blessing in disguise", meaning: "A good thing that seemed bad at first.", example: "Losing that job was a blessing in disguise — it pushed me to start my own business." },
  { idiom: "A piece of cake", meaning: "Something very easy to do.", example: "The exam was a piece of cake after all that revision." },
  { idiom: "Back to the drawing board", meaning: "Start over again after a failed attempt.", example: "The prototype didn't work, so it's back to the drawing board." },
  { idiom: "Beat around the bush", meaning: "Avoid saying what you really mean.", example: "Stop beating around the bush and tell me what happened." },
  { idiom: "Bite the bullet", meaning: "Force yourself to do something unpleasant.", example: "I finally bit the bullet and booked the dentist appointment." },
  { idiom: "Break the ice", meaning: "Do something to relieve tension or start a conversation.", example: "A quick joke helped break the ice with the new team." },
  { idiom: "Burn the midnight oil", meaning: "Work late into the night.", example: "She burned the midnight oil to finish the report on time." },
  { idiom: "Call it a day", meaning: "Stop working on something for the day.", example: "We've done enough — let's call it a day." },
  { idiom: "Cost an arm and a leg", meaning: "Be extremely expensive.", example: "That new phone costs an arm and a leg." },
  { idiom: "Cry over spilled milk", meaning: "Be upset about something that can't be undone.", example: "It's gone now; no use crying over spilled milk." },
  { idiom: "Cut corners", meaning: "Do something cheaply or carelessly to save time or money.", example: "They cut corners on the build and it showed." },
  { idiom: "Devil's advocate", meaning: "Argue the opposite side to test an idea.", example: "Let me play devil's advocate for a moment." },
  { idiom: "Down to earth", meaning: "Practical and sensible; modest.", example: "Despite her fame, she's remarkably down to earth." },
  { idiom: "Draw the line", meaning: "Set a limit on what you will accept.", example: "I'll help, but I draw the line at working weekends." },
  { idiom: "Easier said than done", meaning: "Harder to do than it sounds.", example: "Saving money is easier said than done." },
  { idiom: "Every cloud has a silver lining", meaning: "Every difficult situation has a positive side.", example: "You lost the match, but every cloud has a silver lining — you learned a lot." },
  { idiom: "Get out of hand", meaning: "Become impossible to control.", example: "The party got out of hand pretty quickly." },
  { idiom: "Get the ball rolling", meaning: "Start something.", example: "Let's get the ball rolling on the new project." },
  { idiom: "Give the benefit of the doubt", meaning: "Choose to believe someone despite doubts.", example: "He was late, but I gave him the benefit of the doubt." },
  { idiom: "Go the extra mile", meaning: "Make more effort than is expected.", example: "Our support team always goes the extra mile." },
  { idiom: "Hit the nail on the head", meaning: "Describe exactly what is causing a situation.", example: "You hit the nail on the head with that comment." },
  { idiom: "Hit the books", meaning: "Study hard.", example: "Finals are next week, so I need to hit the books." },
  { idiom: "In the same boat", meaning: "In the same difficult situation as others.", example: "Don't worry, we're all in the same boat here." },
  { idiom: "It's not rocket science", meaning: "It's not difficult to understand.", example: "Come on, it's not rocket science — just follow the steps." },
  { idiom: "Jump on the bandwagon", meaning: "Join something popular.", example: "Everyone jumped on the bandwagon after the trend went viral." },
  { idiom: "Keep an eye on", meaning: "Watch carefully.", example: "Could you keep an eye on my bag for a second?" },
  { idiom: "Kill two birds with one stone", meaning: "Solve two problems with one action.", example: "Biking to work kills two birds with one stone — exercise and commuting." },
  { idiom: "Let the cat out of the bag", meaning: "Reveal a secret by accident.", example: "He let the cat out of the bag about the surprise party." },
  { idiom: "Miss the boat", meaning: "Miss an opportunity.", example: "I waited too long and missed the boat on those tickets." },
  { idiom: "On the same page", meaning: "In agreement; sharing the same understanding.", example: "Let's make sure we're all on the same page before we start." },
  { idiom: "Once in a blue moon", meaning: "Very rarely.", example: "We only see each other once in a blue moon now." },
  { idiom: "Out of the blue", meaning: "Suddenly and unexpectedly.", example: "She called me out of the blue after ten years." },
  { idiom: "Piece of mind", meaning: "A feeling of calm because you have no worries.", example: "Insurance gives me peace of mind." },
  { idiom: "Pull someone's leg", meaning: "Tease or joke with someone.", example: "Relax, I'm just pulling your leg." },
  { idiom: "Raining cats and dogs", meaning: "Raining very heavily.", example: "Take an umbrella — it's raining cats and dogs." },
  { idiom: "Read between the lines", meaning: "Understand a hidden meaning.", example: "Read between the lines and you'll see she's unhappy." },
  { idiom: "See eye to eye", meaning: "Agree completely.", example: "We don't always see eye to eye, but we respect each other." },
  { idiom: "Sit on the fence", meaning: "Avoid making a decision.", example: "Stop sitting on the fence and pick a side." },
  { idiom: "Speak of the devil", meaning: "Said when someone you were just talking about appears.", example: "Speak of the devil — here she comes now." },
  { idiom: "Spill the beans", meaning: "Reveal secret information.", example: "Come on, spill the beans — what did he say?" },
  { idiom: "Steal someone's thunder", meaning: "Take attention or credit from someone.", example: "Don't announce it yet — you'll steal her thunder." },
  { idiom: "Take it with a grain of salt", meaning: "Don't take something too seriously.", example: "Take online reviews with a grain of salt." },
  { idiom: "The ball is in your court", meaning: "It's your turn to make a decision or act.", example: "I've made my offer; now the ball is in your court." },
  { idiom: "The best of both worlds", meaning: "A situation with two different advantages at once.", example: "Working from home twice a week is the best of both worlds." },
  { idiom: "The last straw", meaning: "The final problem that makes a situation unbearable.", example: "His rudeness today was the last straw." },
  { idiom: "Throw in the towel", meaning: "Give up.", example: "After three failed attempts, he threw in the towel." },
  { idiom: "Under the weather", meaning: "Feeling slightly ill.", example: "I'm a bit under the weather, so I'll stay home today." },
  { idiom: "Up in the air", meaning: "Uncertain; not yet decided.", example: "Our holiday plans are still up in the air." },
  { idiom: "When pigs fly", meaning: "Something that will never happen.", example: "He'll tidy his room when pigs fly." },
  { idiom: "Wrap your head around", meaning: "Understand something difficult.", example: "It took me a while to wrap my head around the new system." },
];

// Days since the Unix epoch in UTC — stable for the whole UTC calendar day.
function utcDayNumber(date) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000
  );
}

export function getIdiomForDate(date = new Date()) {
  const idx = utcDayNumber(date) % IDIOM_OF_DAY_LIST.length;
  return IDIOM_OF_DAY_LIST[idx];
}
