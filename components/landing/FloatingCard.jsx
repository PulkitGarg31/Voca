// Glassy annotation card that floats over the phone mockups (as in the design).
// Position it with `className` (absolute placement passed by the parent).
export default function FloatingCard({ icon: Icon, title, subtitle, className = "", tone = "neutral" }) {
  const toneCls =
    tone === "accent"
      ? "bg-accent/15 text-accent"
      : tone === "amber"
      ? "bg-amber-400/20 text-amber-500"
      : "bg-accent/10 text-accent";
  return (
    <div
      className={`absolute z-30 flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/90 px-3.5 py-2.5 shadow-xl dark:border-white/10 dark:bg-[#101a2e]/95 ${className}`}
    >
      {Icon && (
        <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="leading-tight">
        <p className="text-xs font-bold text-ink">{title}</p>
        {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
