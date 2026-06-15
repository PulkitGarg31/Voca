import { SectionLabel, TwoToneHeading, FeatureCard } from "@/components/landing/primitives";
import { Sparkle, Chat, Repeat, Bulb, Cards, Chart, Search } from "@/components/landing/Icons";

const FEATURES = [
  { icon: Chat, title: "AI vocabulary chat", body: "Chat with an AI tutor that explains words, quizzes you, and uses them in real context." },
  { icon: Repeat, title: "Spaced repetition engine", body: "A Leitner-style scheduler resurfaces each word right before you'd forget it." },
  { icon: Bulb, title: "Smart word help", body: "Instant examples, mnemonics, and usage tips generated for every word you save." },
  { icon: Cards, title: "Practice your way", body: "Flashcards, multiple-choice quizzes, and spelling drills to lock words in." },
  { icon: Chart, title: "Progress & streaks", body: "Track mastery levels, daily streaks, and exactly what's due for review." },
  { icon: Search, title: "One-tap lookups", body: "Add words from built-in dictionary lookups or bulk-import a whole list." },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <div className="max-w-2xl">
        <SectionLabel icon={Sparkle}>AI powered features</SectionLabel>
        <TwoToneHeading className="mt-4" top="Everything you need to" accent="become truly fluent" />
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title}>{f.body}</FeatureCard>
        ))}
      </div>
    </section>
  );
}
