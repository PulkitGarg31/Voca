import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MarketingHeader from "@/components/landing/MarketingHeader";
import Footer from "@/components/landing/Footer";

// Shared editorial layout for the marketing info pages (About, Terms, Privacy):
// fixed marketing header, a narrow prose column, and the standard footer.
export default async function InfoPage({ title, tagline, updated, children }) {
  const session = await getServerSession(authOptions);
  return (
    <main className="relative">
      <MarketingHeader loggedIn={Boolean(session?.user?.id)} />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-32 md:pt-36">
        <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
        {tagline && <p className="mt-4 text-base text-muted md:text-lg">{tagline}</p>}
        {updated && <p className="mt-3 text-xs uppercase tracking-widest text-faint">Last updated: {updated}</p>}
        <div className="mt-12 space-y-10">{children}</div>
      </div>
      <Footer />
    </main>
  );
}

export function InfoSection({ heading, children }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ink">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
