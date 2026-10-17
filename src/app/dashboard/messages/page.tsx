"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft, Send, MessageSquare, MoreVertical, ShieldBan, Flag, Loader2, Search, Check, CheckCheck, X,
} from "lucide-react";

type Person = { id: number; name: string; university: string; country: string; visa_type: string; role: string };
type Msg = { id: number; conversation_id: number; sender_id: number; content: string; created_at: string; read: boolean };
type ConvSummary = { id: number; other: Person; last_message: Msg | null; unread: number; blocked_by_me: boolean; updated_at: string };
type Thread = { id: number; other: Person | null; blocked: boolean; blocked_by_me: boolean; other_read_up_to: number };

const initials = (name: string) => name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "?";
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  // Stable colour per person so avatars are easy to tell apart.
  const palette = ["bg-indigo-600", "bg-violet-700", "bg-cyan-600", "bg-coral-500", "bg-amber-600", "bg-sky-700"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span className={`${palette[h % palette.length]} text-white font-bold rounded-full flex items-center justify-center shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

const dayLabel = (iso: string) => {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
const timeLabel = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [convs, setConvs] = useState<ConvSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState<Msg | null>(null);
  const [notice, setNotice] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);

  const setUrl = (id: number | null) => {
    const url = id ? `/dashboard/messages?c=${id}` : "/dashboard/messages";
    window.history.replaceState(window.history.state, "", url);
  };

  const loadConversations = useCallback(async () => {
    const { data } = await api.get<{ conversations: ConvSummary[] }>("/messages/conversations");
    if (data) setConvs(data.conversations);
    setListLoading(false);
  }, []);

  // First load: honour ?c=<id> or ?to=<userId> (from "Message" buttons elsewhere).
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const to = Number(params.get("to"));
    const c = Number(params.get("c"));
    (async () => {
      if (to) {
        const { data, error: e } = await api.post<{ conversation: { id: number } }>("/messages/conversations", { user_id: to });
        if (data) { setActiveId(data.conversation.id); setUrl(data.conversation.id); }
        else if (e) setNotice(e);
      } else if (c) {
        setActiveId(c);
      }
      loadConversations();
    })();
  }, [user, loadConversations]);

  // Refresh the list every 15 s while the tab is visible.
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => { if (!document.hidden) loadConversations(); }, 15000);
    return () => clearInterval(t);
  }, [user, loadConversations]);

  const loadThread = useCallback(async (id: number, incremental: boolean) => {
    const after = incremental ? lastIdRef.current : 0;
    const { data, error: e } = await api.get<{ conversation: Thread; messages: Msg[] }>(`/messages/conversations/${id}?after=${after}`);
    if (e) { if (!incremental) setError(e); return; }
    if (!data) return;
    setThread(data.conversation);
    if (incremental) {
      if (data.messages.length) setMessages((prev) => [...prev, ...data.messages.filter((m) => !prev.some((p) => p.id === m.id))]);
    } else {
      setMessages(data.messages);
    }
    const last = data.messages[data.messages.length - 1];
    if (last) lastIdRef.current = Math.max(lastIdRef.current, last.id);
    // Opening a chat marks it read; reflect that in the list immediately.
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }, []);

  // Open a conversation, then poll it every 4 s.
  useEffect(() => {
    if (!activeId) { setThread(null); setMessages([]); return; }
    setError(""); setMenuOpen(false); lastIdRef.current = 0;
    loadThread(activeId, false);
    const t = setInterval(() => { if (!document.hidden) loadThread(activeId, true); }, 4000);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages.length, activeId]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !activeId || sending) return;
    setSending(true); setError("");
    const { data, error: e } = await api.post<{ message: Msg }>(`/messages/conversations/${activeId}`, { content });
    setSending(false);
    if (e) { setError(e); return; }
    setDraft("");
    if (data) {
      setMessages((prev) => [...prev, data.message]);
      lastIdRef.current = Math.max(lastIdRef.current, data.message.id);
      setConvs((prev) => {
        const rest = prev.filter((c) => c.id !== activeId);
        const mine = prev.find((c) => c.id === activeId);
        return mine ? [{ ...mine, last_message: data.message, updated_at: data.message.created_at }, ...rest] : prev;
      });
    }
  };

  const toggleBlock = async () => {
    if (!thread?.other) return;
    setMenuOpen(false);
    const path = `/users/${thread.other.id}/block`;
    const { error: e } = thread.blocked_by_me ? await api.delete(path) : await api.post(path, {});
    if (e) { setError(e); return; }
    setNotice(thread.blocked_by_me ? `You unblocked ${thread.other.name}.` : `You blocked ${thread.other.name}. They can't message you.`);
    loadThread(thread.id, false); loadConversations();
  };

  const sendReport = async (reason: string) => {
    if (!reporting) return;
    const { error: e } = await api.post("/users/reports", { target_type: "message", target_id: reporting.id, reason });
    setReporting(null);
    setNotice(e ? e : "Thanks. An admin will review this message.");
  };

  const visibleConvs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? convs.filter((c) => `${c.other.name} ${c.other.university} ${c.other.country}`.toLowerCase().includes(q)) : convs;
  }, [convs, filter]);

  // Group messages by day for date separators.
  const grouped = useMemo(() => {
    const out: { day: string; items: Msg[] }[] = [];
    for (const m of messages) {
      const d = dayLabel(m.created_at);
      if (!out.length || out[out.length - 1].day !== d) out.push({ day: d, items: [m] });
      else out[out.length - 1].items.push(m);
    }
    return out;
  }, [messages]);
  const lastMine = [...messages].reverse().find((m) => m.sender_id === user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      <main className="pt-16 md:pl-60 h-[100dvh]">
        <div className="h-full max-w-6xl mx-auto md:p-6">
          {!user && !authLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Link href="/login?force=1" className="text-indigo-700 dark:text-indigo-300 font-semibold">Sign in</Link> to message other students.
            </div>
          ) : (
          <div className="h-full md:rounded-2xl md:border border-border bg-card overflow-hidden grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
            {/* Conversation list */}
            <aside className={`${activeId ? "hidden md:flex" : "flex"} flex-col min-h-0 min-w-0 border-r border-border pb-16 md:pb-0`}>
              <div className="p-4 border-b border-border">
                <h1 className="text-lg font-extrabold text-foreground">Messages</h1>
                <label className="relative block mt-3">
                  <span className="sr-only">Search conversations</span>
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input id="dm-search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search people"
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
              </div>
              <div className="flex-1 overflow-y-auto">
                {listLoading ? (
                  <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
                ) : visibleConvs.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-3"><MessageSquare size={22} /></div>
                    <p className="text-sm font-semibold text-foreground">{filter ? "No one matches that name" : "No messages yet"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filter ? "Try another name." : <>Tap <strong>Message</strong> on someone&apos;s question, answer or club member list to start a chat.</>}
                    </p>
                  </div>
                ) : (
                  <ul>
                    {visibleConvs.map((c) => (
                      <li key={c.id}>
                        <button onClick={() => { setActiveId(c.id); setUrl(c.id); }}
                          aria-current={activeId === c.id}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:bg-accent ${activeId === c.id ? "bg-indigo-500/[0.08]" : "hover:bg-accent"}`}>
                          <Avatar name={c.other.name} size={44} />
                          <span className="flex-1 min-w-0">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className={`truncate text-sm ${c.unread ? "font-extrabold text-foreground" : "font-semibold text-foreground/90"}`}>{c.other.name}</span>
                              {c.last_message && <span className="text-[11px] text-muted-foreground shrink-0">{formatRelativeTime(c.last_message.created_at)}</span>}
                            </span>
                            <span className="flex items-center justify-between gap-2">
                              <span className={`truncate text-xs ${c.unread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                                {c.blocked_by_me ? "Blocked" : c.last_message ? `${c.last_message.sender_id === user?.id ? "You: " : ""}${c.last_message.content}` : "Say hello 👋"}
                              </span>
                              {c.unread > 0 && (
                                <span className="h-5 min-w-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center" aria-label={`${c.unread} unread`}>{c.unread}</span>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>

            {/* Thread */}
            <section className={`${activeId ? "flex" : "hidden md:flex"} flex-col min-h-0 min-w-0`}>
              {!activeId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-3"><MessageSquare size={26} /></div>
                  <p className="text-sm font-semibold text-foreground">Choose a conversation</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">Ask a senior about their internship, find a roommate, or plan a club meetup.</p>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 px-3 sm:px-4 h-16 border-b border-border shrink-0 relative">
                    <button onClick={() => { setActiveId(null); setUrl(null); }} className="md:hidden p-2 -ml-1 rounded-lg hover:bg-accent" aria-label="Back to conversations">
                      <ArrowLeft size={18} />
                    </button>
                    {thread?.other && <Avatar name={thread.other.name} size={38} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{thread?.other?.name || "…"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[thread?.other?.university?.toUpperCase(), thread?.other?.country, thread?.other?.visa_type].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Conversation options" className="p-2 rounded-lg hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-3 top-14 z-20 w-52 rounded-xl border border-border bg-card shadow-lg p-1">
                        <button onClick={toggleBlock} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-500/10">
                          <ShieldBan size={15} /> {thread?.blocked_by_me ? "Unblock" : "Block"} {thread?.other?.name.split(" ")[0]}
                        </button>
                      </div>
                    )}
                  </header>

                  {notice && (
                    <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-foreground" role="status">
                      <span className="flex-1">{notice}</span>
                      <button onClick={() => setNotice("")} aria-label="Dismiss"><X size={13} /></button>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4 bg-background/40">
                    {messages.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-8">
                        This is the start of your conversation with {thread?.other?.name}. Be friendly and respectful.
                      </p>
                    )}
                    {grouped.map((g) => (
                      <div key={g.day} className="space-y-1.5">
                        <p className="text-center text-[11px] font-semibold text-muted-foreground py-1">{g.day}</p>
                        {g.items.map((m) => {
                          const mine = m.sender_id === user?.id;
                          return (
                            <div key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] sm:max-w-[70%] flex items-end gap-1 ${mine ? "flex-row-reverse" : ""}`}>
                                <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                  mine ? "bg-indigo-600 text-white rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md"}`}>
                                  {m.content}
                                  <span className={`block text-[10px] mt-0.5 ${mine ? "text-white/70 text-right" : "text-muted-foreground"}`}>{timeLabel(m.created_at)}</span>
                                </div>
                                {!mine && (
                                  <button onClick={() => setReporting(m)} aria-label="Report this message"
                                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-muted-foreground hover:text-red-600">
                                    <Flag size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {lastMine && (
                      <p className="text-right text-[11px] text-muted-foreground pr-1 -mt-2 inline-flex w-full justify-end items-center gap-1">
                        {lastMine.read || (thread?.other_read_up_to ?? 0) >= lastMine.id ? <><CheckCheck size={12} /> Seen</> : <><Check size={12} /> Sent</>}
                      </p>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {reporting && (
                    <div className="mx-3 sm:mx-4 mb-2 rounded-xl border border-border bg-card p-3" role="dialog" aria-label="Report message">
                      <p className="text-xs font-semibold text-foreground mb-2">Why are you reporting this message?</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Spam or scam", "Harassment", "Hate or threats", "Something else"].map((r) => (
                          <button key={r} onClick={() => sendReport(r)} className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:border-red-500/50 hover:text-red-600">{r}</button>
                        ))}
                        <button onClick={() => setReporting(null)} className="h-8 px-3 text-xs text-muted-foreground">Cancel</button>
                      </div>
                    </div>
                  )}

                  {thread?.blocked ? (
                    <p className="px-4 py-4 border-t border-border text-center text-xs text-muted-foreground pb-20 md:pb-4">
                      {thread.blocked_by_me ? "You blocked this person. Unblock them from the ⋮ menu to message again." : "You can't reply to this conversation."}
                    </p>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border p-3 flex items-end gap-2 pb-20 md:pb-3">
                      <label className="flex-1">
                        <span className="sr-only">Message</span>
                        <textarea id="dm-input" rows={1} value={draft} maxLength={2000}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                          placeholder={`Message ${thread?.other?.name.split(" ")[0] || ""}`}
                          className="w-full max-h-32 min-h-10 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </label>
                      <button type="submit" disabled={!draft.trim() || sending} aria-label="Send"
                        className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </form>
                  )}
                  {error && <p className="px-4 pb-3 text-xs text-red-600" role="alert">{error}</p>}
                </>
              )}
            </section>
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
