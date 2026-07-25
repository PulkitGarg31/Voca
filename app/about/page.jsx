import InfoPage, { InfoSection } from "@/components/landing/InfoPage";

export const metadata = { title: "About us | VOCA" };

export default function AboutPage() {
  return (
    <InfoPage
      title="About VOCA"
      tagline="A vocabulary companion built around one idea: words should stick, not slip away."
    >
      <InfoSection heading="What VOCA is">
        <p>
          VOCA is a vocabulary learning platform that combines an AI tutor with a
          spaced repetition engine. You collect words as you encounter them, and VOCA
          takes care of the hard part: bringing each word back right before you would
          forget it, until it is truly yours.
        </p>
      </InfoSection>
      <InfoSection heading="How it works">
        <p>
          Every word you save gets a mastery level. Practice sessions, flashcards,
          quizzes, spelling drills, and pronunciation checks feed that level, and a
          Leitner-style scheduler decides when each word is due for review again.
        </p>
        <p>
          Alongside the scheduler, an AI chat tutor explains words in context, quizzes
          you on them, and generates examples and mnemonics on demand. Streaks and a
          daily goal keep the habit alive.
        </p>
      </InfoSection>
      <InfoSection heading="Why we built it">
        <p>
          Most vocabulary tools stop at showing you a definition. Research on memory is
          clear that reading a definition once is nearly useless; retrieval at the
          right moment is what builds durable recall. VOCA exists to put that science
          into a tool that feels pleasant to use every day.
        </p>
      </InfoSection>
      {/* Creator card: a standalone highlight box closing the page. */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-accent/10 font-display text-xl font-extrabold text-accent">
            PG
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-faint">Meet the creator</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">Pulkit Garg</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Designer and developer of VOCA. Built everything here, from the spaced
              repetition engine to the AI tutor, around one goal: words that stay learned.
            </p>
          </div>
          <a
            href="https://github.com/PulkitGarg31"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </InfoPage>
  );
}
