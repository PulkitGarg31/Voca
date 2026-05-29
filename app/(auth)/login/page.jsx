"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);

  // Show a confirmation when arriving from a successful registration.
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("registered")) {
      setRegistered(true);
    }
    // Enable the Google button only if the provider is configured server-side.
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((p) => setHasGoogle(Boolean(p?.google)))
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else router.push("/statistics");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <span className="font-display text-2xl tracking-[0.1em] text-ink">VOCA</span>
          </div>
          <h1 className="font-display text-[3.5rem] leading-none tracking-[0.03em] text-ink">WELCOME BACK</h1>
          <p className="text-sm text-faint mt-2">Sign in to continue learning</p>
        </div>

        {registered && (
          <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
            Account created — please sign in.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Email</label>
            <input type="email" required placeholder="you@example.com" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Password</label>
            <input type="password" required placeholder="••••••••" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="text-accent text-sm bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">{error}</p>}
          <div className="pt-2 flex gap-3">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
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

        <p className="text-muted text-sm text-center mt-6">
          No account?{" "}
          <Link href="/register" className="text-accent font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
