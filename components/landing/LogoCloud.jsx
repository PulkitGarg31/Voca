const NAMES = ["Lexica", "ByteBoost", "Hexagon", "Codelink", "Netdot", "Wordly"];

export default function LogoCloud() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-faint">
          Trusted by curious learners everywhere
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {NAMES.map((n) => (
            <span key={n} className="font-display text-lg font-bold tracking-tight text-faint/80">{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
