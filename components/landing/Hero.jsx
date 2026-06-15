import Link from "next/link";
import { SkySection } from "@/components/landing/Sky";
import { ArrowRight, Sparkle, Flame, Bulb, Repeat } from "@/components/landing/Icons";
import DevicePreview from "@/components/landing/DevicePreview";
import FloatingCard from "@/components/landing/FloatingCard";

export default function Hero({ loggedIn }) {
  return (
    <SkySection id="hero" className="pb-28 pt-32 md:pb-36" waveBottom waveBottomFill="fill-bg">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-ink/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink/90">
          <Sparkle className="h-3.5 w-3.5 text-accent" /> AI-powered vocabulary learning
        </span>
        <h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-ink md:text-7xl">
          Build a vocabulary
          <br className="hidden sm:block" /> that <span className="text-accent">finally sticks</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-ink/70 md:text-lg">
          VOCA blends AI conversations, spaced repetition, and smart practice so you
          learn new words 10× faster — and actually remember them.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <Link href="/statistics" className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-ink/10">
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-ink/10">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="rounded-full border border-white/60 bg-white/70 px-6 py-3 text-sm font-semibold text-ink shadow-sm backdrop-blur transition-all hover:bg-white dark:border-white/10 dark:bg-white/10">
                See how it works
              </a>
            </>
          )}
        </div>

        {/* phone + floating annotation cards */}
        <div className="relative mx-auto mt-16 flex max-w-2xl justify-center">
          <FloatingCard
            icon={Flame}
            title="7-day streak!"
            subtitle="Keep it going"
            tone="amber"
            className="left-0 top-6 hidden sm:flex md:left-4"
          />
          <FloatingCard
            icon={Bulb}
            title="Mnemonic ready"
            subtitle={"for “eloquent”"}
            className="right-0 top-24 hidden sm:flex md:right-2"
          />
          <FloatingCard
            icon={Repeat}
            title="5 words due"
            subtitle="for review today"
            className="bottom-10 left-2 hidden md:flex"
          />
          <DevicePreview />
        </div>
      </div>
    </SkySection>
  );
}
