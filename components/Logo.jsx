// VOCA brand mark: an open-book "V" of fanned page strokes (from new_logo.png,
// redrawn as SVG so it stays crisp and picks up the theme's gold accent instead
// of shipping the PNG's baked-in cream background). The glyph uses currentColor;
// LogoTile renders it bare in the accent tone at the size the call site asks for.

export function LogoMark({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {/* outer covers joined by the rounded spine */}
      <path
        d="M13 9 L26 44 C27.5 50.5 36.5 50.5 38 44 L51 9"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* fanned inner pages, left then right */}
      <path d="M19.5 13 L28 39" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M23.5 12 L30 40.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M27.5 11.5 L31.5 42" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44.5 13 L36 39" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M40.5 12 L34 40.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M36.5 11.5 L32.5 42" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// The standard logo chip: the bare gold mark (no background tile, matching the
// brand image). `markClassName` is accepted for call-site compatibility but the
// mark always fills the box `className` describes; the old values sized an
// inset glyph inside a tile that no longer exists.
export function LogoTile({ className = "h-8 w-8", markClassName: _ignored }) {
  return (
    <span className={`inline-flex items-center justify-center text-accent ${className}`}>
      <LogoMark className="h-full w-full" />
    </span>
  );
}

// Mark + serif wordmark lockup. All caps, one face, per the brand rules.
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
