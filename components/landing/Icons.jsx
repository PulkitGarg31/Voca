// Inline SVG icons for the landing page. All inherit `currentColor` and take a
// className so callers control size/color via Tailwind (matches the codebase
// convention of hand-rolled SVGs rather than an icon dependency).
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export const ArrowRight = (p) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Check = (p) => (
  <svg {...base} {...p}><path d="M20 6 9 17l-5-5" /></svg>
);
export const X = (p) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const Sparkle = (p) => (
  <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></svg>
);
export const Chat = (p) => (
  <svg {...base} {...p}><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.9-5.6a8.4 8.4 0 0 1-.9-3.9A8.5 8.5 0 0 1 21 11.5Z" /></svg>
);
export const Repeat = (p) => (
  <svg {...base} {...p}><path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" /></svg>
);
export const Bulb = (p) => (
  <svg {...base} {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" /></svg>
);
export const Cards = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="14" height="14" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v11" /></svg>
);
export const Chart = (p) => (
  <svg {...base} {...p}><path d="M3 3v18h18M8 16v-5M13 16V8M18 16v-9" /></svg>
);
export const Search = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const Flame = (p) => (
  <svg {...base} {...p}><path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 0-2-1-3 3 1 5 4 5 7a6 6 0 0 1-12 0c0-4 4-5 6-11Z" /></svg>
);
export const Book = (p) => (
  <svg {...base} {...p}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM18 19H6" /></svg>
);
export const Play = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3z" /></svg>
);
