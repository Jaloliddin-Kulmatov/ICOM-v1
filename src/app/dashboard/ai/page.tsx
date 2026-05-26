"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Sparkles, Send, Bot, User, RefreshCw, Loader2 } from "lucide-react";

interface Message { id: string; role: "user" | "assistant"; content: string; }

const QUICK = [
  "How do I extend my D-2 visa?",
  "How to open a Kakao Bank account",
  "What is NHIS and how do I enroll?",
  "Find part-time jobs near JBNU",
  "Best Korean food to try in Jeonju",
  "How to use public transport in Jeonju",
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function sendToAI(message: string, history: Message[]): Promise<string> {
  const token = localStorage.getItem("icon_token");
  const res = await fetch(`${API}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ message, history: history.map(m => ({ role: m.role, content: m.content })) }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "AI error"); }
  return (await res.json()).reply;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    setError("");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const reply = await sendToAI(msg, messages);
      setMessages(prev => [...prev, { id: Date.now() + "r", role: "assistant", content: reply }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  }, [loading, messages]);

  // Auto-send a question if the page was opened with ?q=… (e.g. from /support)
  useEffect(() => {
    if (autoSentRef.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim()) {
      autoSentRef.current = true;
      send(q);
    }
    // We intentionally only run this once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ICOM AI</h1>
              <p className="text-xs text-emerald-500">Your Korea guide</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setError(""); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:bg-white/5 transition-all">
              <RefreshCw size={12} /> Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-indigo-400" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-2">Ask me anything about Korea</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Visa, banking, housing, jobs, food, transport — I&apos;m here to help.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK.map(q => (
                  <button key={q} onClick={() => send(q)} className="text-xs px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-400 hover:bg-indigo-500/15 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.role === "assistant" ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-white/10 border border-white/15"}`}>
                {m.role === "assistant" ? <Bot size={14} className="text-white" /> : <User size={13} className="text-muted-foreground" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-indigo-500 text-white rounded-tr-sm" : "bg-white/5 border border-white/10 text-foreground rounded-tl-sm"}`}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl border border-white/10 px-4 py-3 focus-within:border-indigo-500/40 transition-colors">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask anything about life in Korea..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-90 transition-all shrink-0"
            >
              {loading ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
