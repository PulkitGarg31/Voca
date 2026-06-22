"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefill from a failed sign-in for an unregistered email (see login page).
  // Read once, then clear so the credentials don't linger in sessionStorage.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("voca_prefill");
      if (raw) {
        const { email, password } = JSON.parse(raw);
        setForm((f) => ({ ...f, email: email || "", password: password || "" }));
        sessionStorage.removeItem("voca_prefill");
      }
    } catch (e) {
      console.warn("Could not read prefill credentials:", e);
    }
  }, []);

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
    <AuthShell
      title="Create account"
      subtitle="Start building your vocabulary today"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <PasswordInput required minLength={6} placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="text-accent text-sm bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">{error}</p>}
        <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
