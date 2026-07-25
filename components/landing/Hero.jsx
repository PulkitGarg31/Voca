import Link from "next/link";
import { SkySection } from "@/components/landing/Sky";
import { ArrowRight, Sparkle, Flame, Bulb, Repeat } from "@/components/landing/Icons";
import DevicePreview from "@/components/landing/DevicePreview";
import FloatingCard from "@/components/landing/FloatingCard";

export default function Hero({ loggedIn }) {
  return (
    <SkySection id="hero" className="pb-28 pt-32 md:pb-36" waveBottom waveBottomFill="fill-bg">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
        {/* Left — editorial copy */}
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-semibold text-muted shadow-sm backdrop-blur">
            <Sparkle className="h-3.5 w-3.5 text-accent" /> AI-powered vocabulary learning
          </span>
          <h1 className="mt-7 font-display text-5xl font-bold leading-[1.04] tracking-tight text-ink md:text-7xl">
            Build a vocabulary
            <br className="hidden sm:block" /> that <span className="italic text-accent">finally sticks</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted md:mx-0 md:text-lg">
            VOCA blends AI conversations, spaced repetition, and smart practice so you
            learn new words 10× faster and actually remember them.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            {loggedIn ? (
              <Link href="/statistics" className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-ink/10">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-ink/10">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#features" className="rounded-full border border-line bg-surface/70 px-6 py-3 text-sm font-semibold text-ink shadow-sm backdrop-blur transition-all hover:bg-surface">
                  See how it works
                </a>
              </>
            )}
          </div>
        </div>

        {/* Right — product preview + floating annotation cards */}
        <div className="relative mx-auto flex max-w-md justify-center md:max-w-none">
          <FloatingCard
            icon={Flame}
            title="7-day streak!"
            subtitle="Keep it going"
            tone="amber"
            className="left-0 top-6 hidden sm:flex"
          />
          <FloatingCard
            icon={Bulb}
            title="Mnemonic ready"
            subtitle={"for “eloquent”"}
            className="right-0 top-24 hidden sm:flex"
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
