// Atmospheric sky background. The fluffy clouds are a single pre-rendered PNG
// (self-generated, see public/sky-clouds.png) used as a background image, so the
// browser rasterizes it once and composites it cheaply — no live SVG filters
// (feTurbulence/feGaussianBlur) that would re-render on every scroll frame. The
// sky gradient, sun/moon glow, and starfield are pure CSS gradients on top.

const LIGHT = [
  "radial-gradient(60% 45% at 86% -8%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 55%)", // sun glow
  "linear-gradient(180deg, #eaf5ff 0%, #cbe6ff 46%, #9ecdf5 100%)", // base sky
].join(",");

const DARK = [
  "radial-gradient(55% 40% at 84% -6%, rgba(120,160,220,0.18) 0%, rgba(120,160,220,0) 55%)", // moon glow
  "radial-gradient(1.5px 1.5px at 18% 14%, rgba(255,255,255,0.9), transparent)",
  "radial-gradient(1.5px 1.5px at 42% 9%, rgba(255,255,255,0.8), transparent)",
  "radial-gradient(1.2px 1.2px at 67% 16%, rgba(255,255,255,0.7), transparent)",
  "radial-gradient(1.6px 1.6px at 83% 11%, rgba(255,255,255,0.85), transparent)",
  "radial-gradient(1.2px 1.2px at 30% 22%, rgba(255,255,255,0.6), transparent)",
  "linear-gradient(180deg, #070d1c 0%, #0a1530 50%, #0b1226 100%)", // base night sky
].join(",");

export function SkyBackdrop({ className = "" }) {
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* sky gradient + glow + stars */}
      <div className="absolute inset-0 dark:hidden" style={{ backgroundImage: LIGHT }} />
      <div className="absolute inset-0 hidden dark:block" style={{ backgroundImage: DARK }} />
      {/* pre-rendered fluffy clouds, anchored to the bottom */}
      <div className="absolute inset-0 bg-[url('/sky-clouds.png')] bg-[length:100%_auto] bg-bottom bg-no-repeat opacity-95 dark:opacity-[0.12]" />
    </div>
  );
}

// A wavy cloud-edge divider. `fill` should match the ADJACENT flat section's
// color so the sky band melts into it. Defaults to the page background.
export function WaveDivider({ position = "bottom", fill = "fill-bg", className = "" }) {
  const isBottom = position === "bottom";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${isBottom ? "bottom-0" : "top-0"} leading-[0] ${className}`}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`w-full h-[44px] md:h-[80px] ${fill} ${isBottom ? "" : "rotate-180"}`}
      >
        <path d="M0,54 C180,104 340,18 540,46 C720,71 860,108 1040,74 C1200,44 1320,58 1440,40 L1440,120 L0,120 Z" />
      </svg>
    </div>
  );
}

// Sky band wrapper: atmospheric backdrop + optional wave dividers + content.
export function SkySection({
  children,
  className = "",
  waveTop = false,
  waveBottom = false,
  waveTopFill = "fill-bg",
  waveBottomFill = "fill-bg",
}) {
  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      <SkyBackdrop />
      {waveTop && <WaveDivider position="top" fill={waveTopFill} className="z-10" />}
      <div className="relative z-10">{children}</div>
      {waveBottom && <WaveDivider position="bottom" fill={waveBottomFill} className="z-10" />}
    </section>
  );
}
