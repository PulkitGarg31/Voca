// Atmospheric sky background with SVG-generated fluffy clouds (no image assets),
// a soft sun glow, faint grain texture, and a starfield in dark mode. Plus a
// wavy cloud-edge divider used to blend sky bands into the flat sections.

// One cumulus cloud: a flat base ellipse with overlapping bumps. Inherits `fill`
// from the parent <g>; a gaussian blur on the group fuses the shapes into fluff.
function Cloud({ cx, cy, s = 1 }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <ellipse cx="0" cy="22" rx="130" ry="34" />
      <circle cx="-66" cy="6" r="34" />
      <circle cx="-22" cy="-16" r="48" />
      <circle cx="34" cy="-10" r="42" />
      <circle cx="80" cy="8" r="32" />
    </g>
  );
}

const FAR = [
  { cx: 240, cy: 150, s: 0.55 },
  { cx: 760, cy: 110, s: 0.5 },
  { cx: 1080, cy: 180, s: 0.6 },
];
const NEAR = [
  { cx: 140, cy: 400, s: 1.15 },
  { cx: 470, cy: 450, s: 1.5 },
  { cx: 300, cy: 500, s: 1.7 },
  { cx: 820, cy: 380, s: 1.05 },
  { cx: 1080, cy: 460, s: 1.35 },
];

export function SkyBackdrop({ id = "sky", className = "" }) {
  const blur = `cloudblur-${id}`;
  const grain = `grain-${id}`;
  const stars = `stars-${id}`;
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* gradient base: day sky → night sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#eaf5ff] via-[#cbe6ff] to-[#9ecdf5] dark:from-[#070d1c] dark:via-[#0a1530] dark:to-[#0b1226]" />
      {/* sun glow (day) / moon glow (night) */}
      <div className="absolute -top-28 right-[10%] h-80 w-80 rounded-full bg-white/70 blur-[90px] dark:bg-sky-300/10" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 620"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <filter id={blur} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
          <filter id={grain}>
            <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="11" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0" />
          </filter>
          <radialGradient id={stars} cx="50%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* fractal cloud texture for atmosphere */}
        <rect width="1200" height="620" filter={`url(#${grain})`} className="opacity-[0.12] dark:opacity-[0.05]" />

        {/* starfield (dark only) */}
        <g className="hidden dark:block">
          {[
            [120, 90], [300, 60], [520, 120], [700, 70], [880, 110], [1040, 70],
            [200, 170], [430, 200], [640, 180], [820, 220], [980, 180], [1120, 150],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill={`url(#${stars})`} />
          ))}
        </g>

        {/* far, faint clouds for depth */}
        <g filter={`url(#${blur})`} className="fill-white/55 dark:fill-slate-300/[0.05]">
          {FAR.map((c, i) => <Cloud key={i} {...c} />)}
        </g>
        {/* near, bright clouds anchored to the bottom */}
        <g filter={`url(#${blur})`} className="fill-white/95 dark:fill-slate-300/[0.07]">
          {NEAR.map((c, i) => <Cloud key={i} {...c} />)}
        </g>
      </svg>
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
  id = "sky",
  children,
  className = "",
  waveTop = false,
  waveBottom = false,
  waveTopFill = "fill-bg",
  waveBottomFill = "fill-bg",
}) {
  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      <SkyBackdrop id={id} />
      {waveTop && <WaveDivider position="top" fill={waveTopFill} className="z-10" />}
      <div className="relative z-10">{children}</div>
      {waveBottom && <WaveDivider position="bottom" fill={waveBottomFill} className="z-10" />}
    </section>
  );
}
