import Link from "next/link";
import { SkySection } from "@/components/landing/Sky";
import { ArrowRight, Play, Chat } from "@/components/landing/Icons";
import DevicePreview from "@/components/landing/DevicePreview";
import FloatingCard from "@/components/landing/FloatingCard";

export default function CTA({ loggedIn }) {
  return (
    <SkySection
      id="cta"
      className="py-28 md:py-32"
      waveTop
      waveTopFill="fill-bg"
      waveBottom
      waveBottomFill="fill-surface"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60">Get started</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-5xl">
            Your first words start
            <br className="hidden sm:block" /> <span className="text-accent">in under 60 seconds</span>
          </h2>
          <p className="mt-5 max-w-md text-ink/70">
            No setup, no credit card. Add a word, start a chat, and let VOCA handle the rest.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={loggedIn ? "/statistics" : "/register"} className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-ink/10">
              {loggedIn ? "Go to dashboard" : "Start learning free"} <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-5 py-3 text-sm font-semibold text-ink shadow-sm backdrop-blur transition-all hover:bg-white dark:border-white/10 dark:bg-white/10">
              <Play className="h-4 w-4 text-accent" /> See features
            </a>
          </div>
        </div>

        <div className="relative flex justify-center">
          <FloatingCard
            icon={Chat}
            title="Chat anytime"
            subtitle="Practice with AI 24/7"
            className="right-0 top-2 hidden sm:flex md:-right-2"
          />
          <DevicePreview />
        </div>
      </div>
    </SkySection>
  );
}
