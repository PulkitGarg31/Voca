"use client";
import { useState, useRef, useEffect } from "react";

// Render **bold** / *italic* markdown as SAFE React nodes (text is escaped by
// React) instead of injecting HTML — prevents XSS from chat/AI/history content.
function renderFormatted(text) {
  const nodes = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={key++}>{m[1]}</strong>);
    else nodes.push(<em key={key++}>{m[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function extractBoldWords(text) {
  const matches = [];
  const regex = /\*\*([A-Za-z][a-zA-Z\s\-]{1,30}?)\*\*/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const w = m[1].trim();
    if (/^[A-Za-z\-]+$/.test(w)) matches.push(w.toLowerCase());
  }
  return [...new Set(matches)];
}

function WordChip({ word, onAddWord }) {
  const [status, setStatus] = useState("idle");

  async function handleAdd() {
    if (status !== "idle" && status !== "error") return;
    setStatus("loading");
    try {
      const dictRes = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
      const dictData = await dictRes.json();
      const saveRes = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          phonetic: dictRes.ok ? dictData.phonetic : "",
          audioUrl: dictRes.ok ? dictData.audioUrl : "",
          meanings: dictRes.ok ? dictData.meanings : [],
          category: "Other",
        }),
      });
      if (saveRes.status === 409) { setStatus("exists"); return; }
      if (!saveRes.ok) { setStatus("error"); return; }
      setStatus("added");
      onAddWord?.();
    } catch {
      setStatus("error");
    }
  }

  const styles = {
    idle: "bg-surface border-line text-muted hover:border-accent hover:text-accent cursor-pointer",
    loading: "bg-surface border-line text-faint cursor-wait",
    added: "bg-accent/10 border-accent/30 text-accent cursor-default",
    exists: "bg-surface-2 border-line text-faint cursor-default",
    error: "bg-red-500/10 border-red-500/30 text-red-500 cursor-pointer",
  };
  const icons = {
    idle: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    loading: <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity={0.25} /><path d="M12 2a10 10 0 0110 10" strokeLinecap="round" /></svg>,
    added: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
    exists: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
    error: <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  };
  const labels = {
    idle: `Add "${word}"`,
    loading: "Adding…",
    added: `Added "${word}"`,
    exists: "Already in list",
    error: "Failed. Retry",
  };

  return (
    <button onClick={handleAdd} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all ${styles[status]}`}>
      {icons[status]}{labels[status]}
    </button>
  );
}

function Bubble({ msg, onAddWord }) {
  const isUser = msg.role === "user";
  const words = !isUser ? extractBoldWords(msg.content) : [];
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-5`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-[rgb(var(--on-primary))] text-[10px] font-bold mr-2.5 flex-shrink-0 mt-0.5">V</div>
      )}
      <div className="flex flex-col gap-2 max-w-[78%]">
        <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${isUser ? "bg-accent text-[rgb(var(--on-primary))] rounded-br-sm" : "bg-surface border border-line text-ink rounded-bl-sm"}`}>
          {renderFormatted(msg.content)}
        </div>
        {words.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {words.map((w) => <WordChip key={w} word={w} onAddWord={onAddWord} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const GREETING = { role: "assistant", content: "Hi! I'm VOCA. Ask me about any word. Words I mention will appear as chips you can **add directly to your list**." };
const STARTERS = [
  "Explain the word 'ephemeral' with examples",
  "Give me 5 advanced academic words",
  "Difference between 'affect' and 'effect'?",
  "Suggest business English words to learn",
];

export default function ChatPage() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [addedCount, setAddedCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const bottomRef = useRef(null);
  const loadSeqRef = useRef(0);   // ignore stale conversation loads
  const sendingRef = useRef(false); // serialize sends (prevents duplicate new chats)

  async function refreshConversations() {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
      return data.conversations || [];
    } catch {
      return [];
    }
  }

  async function openConversation(id) {
    const seq = ++loadSeqRef.current; // newest open wins; older responses are ignored
    setHistoryLoading(true);
    setConversationId(id);
    setAddedCount(0);
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (seq !== loadSeqRef.current) return; // a newer open superseded this one
      setMessages([GREETING, ...(data.history || [])]);
    } catch {
      if (seq === loadSeqRef.current) setMessages([GREETING]);
    } finally {
      if (seq === loadSeqRef.current) setHistoryLoading(false);
    }
  }

  function newChat() {
    setConversationId(null);
    setMessages([GREETING]);
    setInput("");
    setAddedCount(0);
  }

  // On mount: load the recent list and open the most recent conversation.
  useEffect(() => {
    let ignore = false;
    async function init() {
      const list = await refreshConversations();
      if (ignore) return;
      if (list.length > 0) await openConversation(list[0].conversationId);
      else setHistoryLoading(false);
    }
    init();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!historyLoading) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, historyLoading]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading || historyLoading || sendingRef.current) return;
    // Serialize sends: a second message before the first response sets the new
    // conversationId would otherwise spawn a duplicate conversation.
    sendingRef.current = true;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.conversationId) setConversationId(data.conversationId);
        refreshConversations(); // surface the new/bumped chat in the sidebar
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Something went wrong. Please try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Please check your connection and try again." }]);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }

  async function deleteConversation(id) {
    try {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return; // leave it in the sidebar if the server didn't delete it
    } catch {
      return;
    }
    setConversations((prev) => prev.filter((c) => c.conversationId !== id));
    if (id === conversationId) newChat();
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pb-6 flex gap-6" style={{ height: "calc(100vh - 6rem)" }}>
      {/* Recent chats sidebar (md+) */}
      <aside className="w-60 flex-shrink-0 hidden md:flex flex-col pt-8 border-r border-line pr-4">
        <button onClick={newChat} className="btn-primary text-xs py-2.5 w-full justify-center mb-4">+ New chat</button>
        <p className="section-label mb-2">Recent</p>
        <div className="flex-1 overflow-y-auto scrollbar-thin -mr-2 pr-2 space-y-1">
          {conversations.length === 0 && <p className="text-[11px] text-faint px-3 py-2">No chats yet</p>}
          {conversations.map((c) => (
            <div
              key={c.conversationId}
              onClick={() => openConversation(c.conversationId)}
              className={`group flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs cursor-pointer transition-colors ${c.conversationId === conversationId ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
            >
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.conversationId); }}
                className="opacity-0 group-hover:opacity-100 text-faint hover:text-red-500 transition-all flex-shrink-0"
                title="Delete chat"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="pt-8 pb-5 border-b border-line flex items-end justify-between flex-shrink-0">
          <div>
            <p className="section-label mb-2">AI assistant</p>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-ink">VOCA AI</h1>
            <p className="text-xs text-faint mt-1">NVIDIA NIM · LangChain · Persistent history</p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {addedCount > 0 && (
              <span className="text-xs font-semibold text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">{addedCount} added</span>
            )}
            <button onClick={newChat} className="btn-ghost text-xs py-2 px-4 md:hidden">+ New</button>
          </div>
        </div>

        {/* Recent chats (mobile dropdown) */}
        <div className="md:hidden flex-shrink-0 pt-3">
          <select
            value={conversationId || ""}
            onChange={(e) => (e.target.value ? openConversation(e.target.value) : newChat())}
            className="input text-xs py-2"
          >
            <option value="">New chat</option>
            {conversations.map((c) => (
              <option key={c.conversationId} value={c.conversationId}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-5 scrollbar-thin">
          {historyLoading ? (
            <div className="flex items-center justify-center h-32 gap-2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-faint">Loading history…</span>
            </div>
          ) : (
            <>
              {messages.length === 1 && (
                <div className="mb-5 grid grid-cols-2 gap-2">
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="text-left text-xs text-muted bg-surface border border-line rounded-2xl px-4 py-3 hover:border-accent hover:text-ink transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.length > 1 && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-line" />
                  <span className="text-[10px] font-semibold tracking-widest text-faint uppercase">Previous {messages.length - 1} messages</span>
                  <div className="flex-1 h-px bg-line" />
                </div>
              )}

              {messages.map((m, i) => (
                <Bubble key={i} msg={m} onAddWord={() => setAddedCount((c) => c + 1)} />
              ))}
            </>
          )}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-[rgb(var(--on-primary))] text-[10px] font-bold mr-2.5 flex-shrink-0">V</div>
              <div className="bg-surface border border-line px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 bg-faint rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 pt-4 border-t border-line">
          <div className="flex gap-3 items-end">
            <textarea
              rows={1}
              className="input flex-1 resize-none max-h-32"
              placeholder={historyLoading ? "Loading…" : "Ask about any word…"}
              value={input}
              disabled={historyLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={() => send()} disabled={loading || historyLoading || !input.trim()} className="btn-primary px-4 py-3 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
          <p className="text-[10px] text-faint mt-2 text-center">History saved automatically · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
