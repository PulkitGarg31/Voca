"use client";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/auth/PasswordInput";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoTile } from "@/components/Logo";
import { Chat, Repeat, Chart } from "@/components/landing/Icons";
import { NO_ACCOUNT_ERROR } from "@/lib/authErrors";

const POINTS = [
  { icon: Chat, text: "Chat with an AI tutor that uses your words in context" },
  { icon: Repeat, text: "Spaced repetition resurfaces words before you forget" },
  { icon: Chart, text: "Track mastery, streaks, and what's due for review" },
];

// Double-slider auth screen. The sign-in form lives on the LEFT half, the
// sign-up form on the RIGHT half, and the branded Noir panel slides across to
// cover whichever one is inactive. Both /login and /register render this same
// component; switching modes animates the panel and swaps the URL via the
// History API (which Next syncs with the router), so there is no page reload.
// On mobile (no split screen) the panel is hidden and the active form fades in.
export default function AuthSlider({ initialMode = "login" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);

  // Sign-in state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  // Sign-up state
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });
  const [regError, setRegError] = useState("");
  const [regNotice, setRegNotice] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    // Show a confirmation when arriving from a successful registration.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("registered")) {
      setRegistered(true);
    }
    // Enable the Google button only if the provider is configured server-side.
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => setHasGoogle(Boolean(p?.google)))
      .catch(() => {});
  }, []);

  function switchMode(next) {
    if (next === mode) return;
    setMode(next);
    setLoginError("");
    setRegError("");
    try {
      window.history.pushState(null, "", next === "login" ? "/login" : "/register");
    } catch {}
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const res = await signIn("credentials", { email: loginForm.email, password: loginForm.password, redirect: false });
    setLoginLoading(false);
    if (res?.error === NO_ACCOUNT_ERROR) {
      // No account for this email: carry the entered credentials straight into
      // the sign-up form and slide over to it.
      setRegForm((f) => ({ ...f, email: loginForm.email, password: loginForm.password }));
      setRegNotice("No account found for that email. Create one below to get started.");
      switchMode("register");
    } else if (res?.error) {
      setLoginError("Invalid email or password");
    } else {
      router.push("/statistics");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Registration failed");
      } else {
        setRegNotice("");
        setRegistered(true);
        switchMode("login");
      }
    } catch {
      setRegError("Network error. Please try again");
    } finally {
      setRegLoading(false);
    }
  }

  const paneClass = (active) =>
    `${active ? "flex auth-pane-enter" : "hidden lg:flex"} min-h-screen flex-col items-center justify-center px-6 py-20 sm:px-10`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg lg:grid lg:grid-cols-2">
      {/* top bar: logo for mobile (the sliding panel carries it on desktop) + theme */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 lg:invisible">
          <LogoTile className="h-8 w-8" />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* LEFT half: sign in */}
      <section aria-hidden={mode !== "login"} className={paneClass(mode === "login")}>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">Sign in to continue learning</p>
          </div>

          {registered && (
            <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              Account created. Please sign in.
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Email</label>
              <input type="email" required placeholder="you@example.com" className="input" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Password</label>
              <PasswordInput required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            </div>
            {loginError && <p className="text-accent text-sm bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">{loginError}</p>}
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loginLoading}>
              {loginLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {hasGoogle && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-line" />
                <span className="text-[10px] font-semibold tracking-widest text-faint uppercase">or</span>
                <div className="flex-1 h-px bg-line" />
              </div>
              <button
                onClick={() => signIn("google", { callbackUrl: "/statistics" })}
                className="w-full flex items-center justify-center gap-2 border border-line bg-surface hover:border-line-strong text-ink text-sm font-semibold py-3 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.36 12 4.75z"/></svg>
                Continue with Google
              </button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            No account?{" "}
            <button onClick={() => switchMode("register")} className="text-accent font-semibold hover:underline">Create one</button>
          </p>
        </div>
      </section>

      {/* RIGHT half: sign up */}
      <section aria-hidden={mode !== "register"} className={paneClass(mode === "register")}>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">Create account</h1>
            <p className="mt-2 text-sm text-muted">Start building your vocabulary today</p>
          </div>

          {regNotice && (
            <p className="mb-4 text-sm text-accent bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">{regNotice}</p>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Full name</label>
              <input type="text" required placeholder="Your name" className="input" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Email</label>
              <input type="email" required placeholder="you@example.com" className="input" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Password</label>
              <PasswordInput required minLength={6} placeholder="Min. 6 characters" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
            </div>
            {regError && <p className="text-accent text-sm bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">{regError}</p>}
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={regLoading}>
              {regLoading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <button onClick={() => switchMode("login")} className="text-accent font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </section>

      {/* Sliding brand panel (desktop only). Covers the RIGHT half in sign-in
          mode and glides to the LEFT half in sign-up mode. */}
      <aside
        className={`absolute inset-y-0 left-0 z-20 hidden w-1/2 flex-col justify-between overflow-hidden border-x border-line bg-bg p-12 transition-transform duration-700 ease-in-out lg:flex ${
          mode === "login" ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* atmosphere */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-2 via-bg to-bg" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        {/* oversized typographic flourish */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-6 select-none font-display text-[20rem] font-extrabold italic leading-none text-accent/10"
        >
          Aa
        </span>

        <Link href="/" className="relative z-10 inline-flex items-center gap-2.5">
          <LogoTile />
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">VOCA</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <span className="section-label">Editorial Noir</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink">
            Build a vocabulary <br /> that <span className="italic text-accent">finally sticks</span>
          </h2>
          <p className="mt-4 text-muted">
            Learn words 10× faster with AI chat, spaced repetition, and smart practice.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted">
                <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-accent shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <button
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            className="relative z-10 mt-9 rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-accent"
          >
            {mode === "login" ? "New here? Create an account" : "Already a member? Sign in"}
          </button>
        </div>
        <p className="relative z-10 text-xs text-faint">© 2026 VOCA. Learn words that stick.</p>
      </aside>
    </div>
  );
}
