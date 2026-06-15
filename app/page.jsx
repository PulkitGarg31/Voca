import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MarketingHeader from "@/components/landing/MarketingHeader";
import Hero from "@/components/landing/Hero";
import LogoCloud from "@/components/landing/LogoCloud";
import Features from "@/components/landing/Features";
import Comparison from "@/components/landing/Comparison";
import Journey from "@/components/landing/Journey";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const loggedIn = Boolean(session?.user?.id);
  return (
    <main className="relative">
      <MarketingHeader loggedIn={loggedIn} />
      <Hero loggedIn={loggedIn} />
      <LogoCloud />
      <Features />
      <Comparison />
      <Journey />
      <Pricing />
      <CTA loggedIn={loggedIn} />
      <Footer />
    </main>
  );
}
