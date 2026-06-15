import Link from "next/link";
import { SkyBand } from "@/components/landing/primitives";
import { ArrowRight } from "@/components/landing/Icons";
import DevicePreview from "@/components/landing/DevicePreview";

export default function CTA({ loggedIn }) {
  return (
    <SkyBand className="py-20">
      <div className="mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink">
            Your first words start <br className="hidden sm:block" />
            <span className="text-accent">in under 60 seconds</span>
          </h2>
          <p className="mt-5 max-w-md text-muted">
            No setup, no credit card. Add a word, start a chat, and let VOCA handle the rest.
          </p>
          <div className="mt-8">
            <Link href={loggedIn ? "/statistics" : "/register"} className="btn-primary inline-flex items-center gap-2">
              {loggedIn ? "Go to dashboard" : "Start learning free"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="flex justify-center"><DevicePreview /></div>
      </div>
    </SkyBand>
  );
}
