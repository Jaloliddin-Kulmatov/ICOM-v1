"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Minimize2, Bot, User, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK = [
  "How do I extend my D-2 visa?",
  "Open a Kakao Bank account",
  "Find part-time jobs near my campus",
  "Translate this Korean form for me",
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function sendToAI(message: string, history: Message[]): Promise<string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
  const url = `${API_BASE}/ai/chat`;
  const body = JSON.stringify({
    message,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Render free-tier backends sleep after ~15min of inactivity and take
  // ~20-40s to wake up. We retry once after a brief delay so users don't
  // see a scary error on the first request after a cold start.
  const tryOnce = async (timeoutMs: number) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: ctl.signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI service error");
      }
      const data = await res.json();
      return data.reply as string;
    } finally {
      clearTimeout(t);
    }
  };

  try {
    return await tryOnce(15000);
  } catch (e: unknown) {
    // Only retry on network/abort errors, not on real server errors.
    const isRetryable =
      e instanceof DOMException && e.name === "AbortError" ||
      (e instanceof TypeError); // browser "Failed to fetch"
    if (!isRetryable) throw e;
    await new Promise((r) => setTimeout(r, 2000));
    return await tryOnce(45000); // give cold-start more headroom
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const didDrag = useRef(false);
  const posRef = useRef<{ x: number; y: number } | null>(null);

  // Keep posRef in sync
  useEffect(() => { posRef.current = pos; }, [pos]);

  // Set initial position bottom-right after mount
  useEffect(() => {
    const p = { x: window.innerWidth - 80, y: window.innerHeight - 80 };
    setPos(p);
    posRef.current = p;
  }, []);

  // Mouse + Touch move/up listeners
  useEffect(() => {
    const move = (cx: number, cy: number) => {
      if (!dragging.current) return;
      didDrag.current = true;
      const newPos = {
        x: Math.max(28, Math.min(window.innerWidth - 28,  cx - dragOffset.current.dx)),
        y: Math.max(28, Math.min(window.innerHeight - 28, cy - dragOffset.current.dy)),
      };
      posRef.current = newPos;
      setPos(newPos);
    };
    const end = () => { dragging.current = false; };

    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { const t = e.touches[0]; move(t.clientX, t.clientY); };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", end);
    };
  }, []);

  const startDrag = (cx: number, cy: number) => {
    if (!posRef.current) return;
    dragging.current = true;
    didDrag.current = false;
    dragOffset.current = { dx: cx - posRef.current.x, dy: cy - posRef.current.y };
  };

  const onMouseDown = (e: React.MouseEvent) => { startDrag(e.clientX, e.clientY); e.preventDefault(); };
  const onTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, minimized]);

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    setError("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await sendToAI(msg, messages);
      setMessages((prev) => [...prev, { id: Date.now().toString() + "r", role: "assistant", content: reply }]);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "";
      // Network failure / CORS / backend cold-start — user-friendly message,
      // no internal paths or developer instructions.
      const isNetwork = !raw || raw.toLowerCase().includes("fetch") || raw.toLowerCase().includes("network");
      setError(
        isNetwork
          ? "Couldn't reach ICOM AI right now. The service may be waking up — please try again in a few seconds."
          : raw || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <>
      {/* ── Desktop / tablet FAB (draggable, hidden on phones) ── */}
      {!open && pos && (
        <button
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onClick={() => { if (!didDrag.current) setOpen(true); }}
          aria-label="Open AI Assistant"
          style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
          className="fixed z-50 hidden md:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white items-center justify-center shadow-[0_4px_24px_rgba(99,102,241,0.5)] hover:shadow-[0_4px_32px_rgba(99,102,241,0.7)] hover:scale-105 active:scale-95 transition-shadow duration-200 animate-pulse-glow cursor-grab active:cursor-grabbing select-none"
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* ── Desktop / tablet panel (floating, draggable anchor) ── */}
      {open && pos && (
        <div
          style={{ left: Math.min(pos.x, window.innerWidth - 370), top: Math.min(Math.max(pos.y - 500, 8), window.innerHeight - 520) }}
          className={`fixed z-50 hidden md:flex w-[360px] rounded-2xl border border-border bg-card shadow-[0_16px_64px_rgba(0,0,0,0.4)] overflow-hidden flex-col ${
            minimized ? "h-14" : "h-[500px]"
          }`}
        >
          {/* Header — drag handle */}
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-indigo-500/10 to-violet-500/10 shrink-0 cursor-grab active:cursor-grabbing select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">ICOM AI</p>
                <p className="text-[10px] text-emerald-500 leading-tight">Your Korea guide</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => { setMessages([]); setError(""); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Clear chat"
                >
                  <RefreshCw size={12} />
                </button>
              )}
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Minimize2 size={13} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
                {/* Welcome */}
                {messages.length === 0 && (
                  <div className="text-center py-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                      <Sparkles size={22} className="text-indigo-500" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">Hi! I&apos;m ICOM AI</p>
                    <p className="text-xs text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                      Ask me anything about life in Korea — visa, banking, housing, jobs, or translation.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                      {QUICK.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/8 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/15 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      m.role === "assistant"
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                        : "bg-muted border border-border"
                    }`}>
                      {m.role === "assistant"
                        ? <Bot size={12} className="text-white" />
                        : <User size={11} className="text-muted-foreground" />
                      }
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-indigo-500 text-white rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm border border-border"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                      <Bot size={12} className="text-white" />
                    </div>
                    <div className="bg-muted border border-border rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 whitespace-pre-wrap leading-relaxed">
                      {error}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 pb-3 pt-2 border-t border-border shrink-0">
                <div className="flex items-center gap-2 bg-muted rounded-xl border border-border px-3 py-2 focus-within:border-indigo-500/40 transition-colors">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask anything about Korea..."
                    disabled={loading}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-90 transition-all shrink-0"
                  >
                    <Send size={12} className="text-white" />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5">
                  ICOM AI
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
