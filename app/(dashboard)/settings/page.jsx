"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import { useToast, useConfirm } from "@/components/Feedback";

// Client-side mirror of lib/providers.js (labels + input hints only).
const AI_PROVIDERS = [
  { id: "nvidia", label: "NVIDIA NIM", hint: "nvapi-…", defaultModel: "meta/llama-3.3-70b-instruct" },
  { id: "openai", label: "OpenAI", hint: "sk-…", defaultModel: "gpt-4o-mini" },
  { id: "gemini", label: "Google Gemini", hint: "AIza…", defaultModel: "gemini-2.5-flash" },
  { id: "anthropic", label: "Anthropic Claude", hint: "sk-ant-…", defaultModel: "claude-haiku-4-5-20251001" },
];

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, mounted, setTheme } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();

  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState(null); // {type, text}
  const [savingName, setSavingName] = useState(false);

  const [goal, setGoal] = useState(10);
  const [savingGoal, setSavingGoal] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [ai, setAi] = useState({ provider: "nvidia", key: "", model: "" });
  const [aiSaved, setAiSaved] = useState(null); // { provider, masked, model } | null
  const [aiMsg, setAiMsg] = useState(null);
  const [savingAi, setSavingAi] = useState(false);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  // Load the saved daily goal.
  useEffect(() => {
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.dailyGoal && setGoal(d.dailyGoal))
      .catch(() => {});
  }, []);

  // Load BYOK status (masked — the full key never reaches the client).
  useEffect(() => {
    fetch("/api/account/api-key")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.provider && setAiSaved(d))
      .catch(() => {});
  }, []);

  async function saveGoal(next) {
    setGoal(next);
    setSavingGoal(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoal: next }),
      });
      if (!res.ok) throw new Error();
      toast.success("Daily goal updated");
    } catch {
      toast.error("Couldn't save daily goal");
    } finally {
      setSavingGoal(false);
    }
  }

  async function saveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    setNameMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      await update({ name: data.name }); // refresh session
      setNameMsg({ type: "ok", text: "Name updated" });
    } catch (err) {
      setNameMsg({ type: "err", text: err.message });
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 6) return setPwMsg({ type: "err", text: "New password must be at least 6 characters" });
    if (pw.next !== pw.confirm) return setPwMsg({ type: "err", text: "New passwords don't match" });
    setSavingPw(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPwMsg({ type: "ok", text: "Password changed" });
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwMsg({ type: "err", text: err.message });
    } finally {
      setSavingPw(false);
    }
  }

  async function deleteAccount() {
    const ok = await confirm({
      title: "Delete your account?",
      message: "This permanently removes your account and ALL your words, practice history and chats. This cannot be undone.",
      confirmLabel: "Delete everything",
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error("Couldn't delete account. Please try again.");
      setDeleting(false);
    }
  }

  async function saveAiKey(e) {
    e.preventDefault();
    setAiMsg(null);
    setSavingAi(true);
    try {
      const res = await fetch("/api/account/api-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: ai.provider, apiKey: ai.key.trim(), model: ai.model.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save key");
      setAiSaved(data);
      setAi({ provider: ai.provider, key: "", model: "" });
      toast.success("API key saved — free AI limits no longer apply");
    } catch (err) {
      setAiMsg({ type: "err", text: err.message });
    } finally {
      setSavingAi(false);
    }
  }

  async function removeAiKey() {
    const ok = await confirm({
      title: "Remove your API key?",
      message: "The key can't be shown again after removal, and the free AI limits will apply to your account.",
      confirmLabel: "Remove key",
      danger: true,
    });
    if (!ok) return;
    setSavingAi(true);
    try {
      const res = await fetch("/api/account/api-key", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAiSaved(null);
      toast.success("API key removed");
    } catch {
      toast.error("Couldn't remove the key");
    } finally {
      setSavingAi(false);
    }
  }

  const Msg = ({ msg }) =>
    msg ? (
      <p className={`text-xs rounded-lg px-3 py-2 ${msg.type === "ok" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-red-500 bg-red-500/10 border border-red-500/20"}`}>
        {msg.text}
      </p>
    ) : null;

  return (
    <div className="max-w-2xl mx-auto px-6 pb-20">
      <div className="pt-2 pb-8 border-b border-line">
        <p className="section-label mb-2">Account</p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-ink">Settings</h1>
      </div>

      {/* Profile */}
      <form onSubmit={saveName} className="py-10 border-b border-line">
        <p className="section-label mb-6">Profile</p>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-ink flex items-center justify-center text-[rgb(var(--on-primary))] text-xl font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm text-faint">Signed in as</p>
            <p className="text-sm font-semibold text-ink">{session?.user?.email}</p>
          </div>
        </div>
        <label className="block text-xs text-muted mb-1.5">Display name</label>
        <div className="flex gap-2">
          <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <button type="submit" disabled={savingName || !name.trim()} className="btn-primary px-5">
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="mt-3"><Msg msg={nameMsg} /></div>
      </form>

      {/* Appearance */}
      <div className="py-10 border-b border-line">
        <p className="section-label mb-6">Appearance</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Theme</p>
            <p className="text-xs text-faint mt-0.5">Choose how VOCA looks</p>
          </div>
          <div className="flex gap-1 bg-surface-2 border border-line rounded-full p-1">
            {["light", "dark"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${mounted && theme === t ? "bg-accent text-[rgb(var(--on-primary))]" : "text-muted hover:text-ink"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Learning */}
      <div className="py-10 border-b border-line">
        <p className="section-label mb-6">Learning</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Daily goal</p>
            <p className="text-xs text-faint mt-0.5">Words to add or practise each day</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => saveGoal(Math.max(1, goal - 1))} disabled={savingGoal} className="w-8 h-8 rounded-full bg-surface-2 border border-line text-ink hover:border-accent transition-colors disabled:opacity-50">–</button>
            <span className="w-12 text-center text-lg font-bold text-ink">{goal}</span>
            <button onClick={() => saveGoal(Math.min(200, goal + 1))} disabled={savingGoal} className="w-8 h-8 rounded-full bg-surface-2 border border-line text-ink hover:border-accent transition-colors disabled:opacity-50">+</button>
          </div>
        </div>
      </div>

      {/* AI API key */}
      <div className="py-10 border-b border-line">
        <p className="section-label mb-6">AI API key</p>
        {aiSaved ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-ink">
                {AI_PROVIDERS.find((p) => p.id === aiSaved.provider)?.label || aiSaved.provider}
              </p>
              <p className="text-xs text-faint mt-0.5 font-mono">
                {aiSaved.masked}{aiSaved.model ? ` · ${aiSaved.model}` : ""}
              </p>
              <p className="text-xs text-faint mt-1">Your key powers AI chat and word help — free limits no longer apply.</p>
            </div>
            <button onClick={removeAiKey} disabled={savingAi} className="btn-ghost text-xs py-2 px-4">
              {savingAi ? "Removing…" : "Remove key"}
            </button>
          </div>
        ) : (
          <form onSubmit={saveAiKey} className="space-y-3">
            <p className="text-xs text-faint">
              Add your own key to lift the free AI limits. NVIDIA keys are free at build.nvidia.com.
            </p>
            <select
              className="input"
              aria-label="AI provider"
              value={ai.provider}
              onChange={(e) => { setAiMsg(null); setAi({ ...ai, provider: e.target.value }); }}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <input
              type="password"
              name="ai-api-key"
              autoComplete="new-password"
              className="input"
              placeholder={`API key (${AI_PROVIDERS.find((p) => p.id === ai.provider)?.hint})`}
              value={ai.key}
              onChange={(e) => setAi({ ...ai, key: e.target.value })}
            />
            <input
              className="input"
              spellCheck={false}
              placeholder={`Model (optional, default: ${AI_PROVIDERS.find((p) => p.id === ai.provider)?.defaultModel})`}
              value={ai.model}
              onChange={(e) => setAi({ ...ai, model: e.target.value })}
            />
            <Msg msg={aiMsg} />
            <button type="submit" disabled={savingAi || !ai.key.trim()} className="btn-primary">
              {savingAi ? "Saving…" : "Save key"}
            </button>
          </form>
        )}
      </div>

      {/* Security */}
      <form onSubmit={changePassword} className="py-10 border-b border-line">
        <p className="section-label mb-6">Change password</p>
        <div className="space-y-3">
          <input type="password" className="input" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <input type="password" className="input" placeholder="New password (min. 6 chars)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <input type="password" className="input" placeholder="Confirm new password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          <Msg msg={pwMsg} />
          <button type="submit" disabled={savingPw || !pw.current || !pw.next} className="btn-primary">
            {savingPw ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="py-10">
        <p className="section-label mb-6 text-red-500">Danger zone</p>
        <div className="border border-red-500/30 bg-red-500/5 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-ink">Delete account</p>
            <p className="text-xs text-faint mt-0.5">Permanently removes your words, practice history and chats.</p>
          </div>
          <button onClick={deleteAccount} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}
