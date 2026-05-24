"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Send, Loader2, Star, CheckCircle2, MessageSquarePlus, Sparkles, Bug, Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!message.trim()) {
      setError("Please write your feedback before submitting.");
      return;
    }
    setSending(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: message.trim(),
          rating: rating || null,
          name: user ? null : name.trim() || null,
          email: user ? null : email.trim() || null,
          page_url: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send feedback.");
      setSuccess(true);
      setMessage("");
      setRating(0);
      setName("");
      setEmail("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-24 md:pb-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-5">
              <MessageSquarePlus size={26} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              We&apos;d love your feedback
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              ICOM is built for international students like you. Tell us what works,
              what&apos;s broken, or what you wish existed.
            </p>
          </div>

          {/* Quick tag suggestions */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Heart, label: "What you love", color: "from-pink-500 to-rose-600" },
              { icon: Bug, label: "Bug report", color: "from-orange-500 to-red-600" },
              { icon: Sparkles, label: "Feature idea", color: "from-indigo-500 to-violet-600" },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setMessage((prev) => prev || `${s.label}: `)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-emerald-500/30 hover:shadow-sm transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <s.icon size={16} className="text-white" />
                </div>
                <span className="text-xs font-medium text-foreground">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Form card */}
          {success ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-10 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Thank you! 🎉</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Your feedback has been received. We read every single submission and use them
                to make ICOM better for everyone.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setSuccess(false)}
                  className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Send another
                </button>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
              {/* Star rating */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-3 block">
                  How is your experience so far?
                  <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (hoverRating || rating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n === rating ? 0 : n)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={32}
                          className={active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
                        />
                      </button>
                    );
                  })}
                  {rating > 0 && (
                    <span className="ml-3 text-sm font-medium text-muted-foreground">
                      {["", "😞 Bad", "😐 Meh", "🙂 OK", "😊 Good", "🤩 Great"][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Your feedback <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think — bugs, feature ideas, things you love, things that frustrated you. Anything goes!"
                  rows={6}
                  maxLength={2000}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1.5 text-right">
                  {message.length}/2000
                </p>
              </div>

              {/* Anonymous user fields */}
              {!user && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Optional — if you&apos;d like a reply
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1.5 block">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Logged-in user note */}
              {user && (
                <div className="px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-muted-foreground">
                  Submitting as <span className="text-foreground font-semibold">{user.name}</span>
                  {user.email && <> · {user.email}</>}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={submit}
                disabled={sending || !message.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send feedback
                  </>
                )}
              </button>

              <p className="text-[11px] text-muted-foreground text-center">
                We&apos;ll never share your feedback publicly without permission.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
