"use client";
import { useState } from "react";
import { SectionLabel, PlanCard } from "@/components/landing/primitives";

const PLANS = (yearly) => [
  {
    name: "Starter", tagline: "Free forever", price: "$0", period: "/mo",
    cta: "Get started free", href: "/register",
    features: ["Up to 100 words", "Flashcards & quizzes", "Daily streak tracking", "Basic AI word help"],
  },
  {
    name: "Pro", tagline: "Pro learner", price: yearly ? "$7" : "$9", period: "/mo", highlighted: true,
    cta: "Start Pro free", href: "/register",
    features: ["Unlimited words", "Unlimited AI conversations", "Spaced-repetition engine", "Mnemonics & examples", "Full progress analytics"],
  },
  {
    name: "Team", tagline: "Team & power", price: yearly ? "$15" : "$19", period: "/mo",
    cta: "Get Team", href: "/register",
    features: ["Everything in Pro", "Shared vocabulary packs", "Team dashboards", "Priority AI model", "Export & integrations"],
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-4 font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink">
              Simple, transparent pricing <br className="hidden sm:block" />
              <span className="text-accent">for every learner</span>
            </h2>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-ink p-1 text-sm font-semibold">
            <button onClick={() => setYearly(false)} className={`px-4 py-2 rounded-full transition-colors ${!yearly ? "bg-white text-ink" : "text-white/70"}`}>Monthly</button>
            <button onClick={() => setYearly(true)} className={`px-4 py-2 rounded-full transition-colors ${yearly ? "bg-white text-ink" : "text-white/70"}`}>Yearly <span className="text-accent">-20%</span></button>
          </div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3 md:items-center">
          {PLANS(yearly).map((p) => <PlanCard key={p.name} {...p} />)}
        </div>
      </div>
    </section>
  );
}
