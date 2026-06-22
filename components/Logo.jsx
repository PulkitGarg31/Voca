// VOCA brand mark — "Bolt V": a bold V with a spark dot. The glyph uses
// currentColor so it inherits the surrounding text color (the on-primary tone
// inside the accent tile). LogoTile is the standard accent rounded-square chip.

export function LogoMark({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <path
        d="M16 19 L32 45 L48 19"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="16.5" r="3.6" fill="currentColor" />
    </svg>
  );
}

export function LogoTile({ className = "h-8 w-8", markClassName = "h-4 w-4" }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-accent text-[rgb(var(--on-primary))] ${className}`}>
      <LogoMark className={markClassName} />
    </span>
  );
}

// Tile + serif wordmark lockup. The wordmark uses the literary display serif.
export function LogoWordmark({ className = "", tileClassName, wordClassName = "text-lg" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoTile className={tileClassName} />
      <span className={`font-display font-extrabold tracking-tight text-ink ${wordClassName}`}>
        VOCA
      </span>
    </span>
  );
}
