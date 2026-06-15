import Link from "next/link";
import { SkyBand } from "@/components/landing/primitives";
import { ArrowRight, Sparkle } from "@/components/landing/Icons";
import DevicePreview from "@/components/landing/DevicePreview";

export default function Hero({ loggedIn }) {
  return (
    <SkyBand className="pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-accent backdrop-blur">
          <Sparkle className="h-3.5 w-3.5" /> AI-powered vocabulary learning
        </span>
        <h1 className="mt-6 font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-ink">
          Build a vocabulary <br className="hidden sm:block" />
          that <span className="text-accent">finally sticks</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-muted">
          VOCA blends AI conversations, spaced repetition, and smart practice so you
          learn new words 10× faster — and actually remember them.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <Link href="/statistics" className="btn-primary inline-flex items-center gap-2">
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="btn-ghost">See how it works</a>
            </>
          )}
        </div>
        <div className="mt-14 flex justify-center">
          <DevicePreview />
        </div>
      </div>
    </SkyBand>
  );
}
