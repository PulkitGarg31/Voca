import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Sky wash at the top — echoes the landing's atmosphere so the floating
          navbar sits on sky and the page header feels connected to the brand. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgb(var(--sky-from)) 0%, rgb(var(--bg) / 0) 100%)" }}
        />
        <div className="absolute inset-x-0 top-0 h-full bg-[url('/sky-clouds.png')] bg-[length:120%_auto] bg-top bg-no-repeat opacity-[0.20] dark:opacity-[0.07]" />
      </div>
      <Navbar user={session.user} />
      <main className="relative pt-24">
        {children}
      </main>
    </div>
  );
}
