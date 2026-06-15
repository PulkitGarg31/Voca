"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Registration failed");
      else router.push("/login?registered=1");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-ink">VOCA</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink">Create account</h1>
          <p className="text-sm text-faint mt-2">Start building your vocabulary today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Full name</label>
            <input type="text" required placeholder="Your name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Email</label>
            <input type="email" required placeholder="you@example.com" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1.5">Password</label>
            <input type="password" required minLength={6} placeholder="Min. 6 characters" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="text-accent text-sm bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">{error}</p>}
          <div className="pt-2">
            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>

        <p className="text-muted text-sm text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
