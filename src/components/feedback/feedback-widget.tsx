"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Send, Loader2, Star, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/**
 * Floating "Feedback" button visible on every page (mobile + desktop).
 * Anyone can submit, including non-logged-in visitors.
 *
 * The button is hidden on the auth pages and the dedicated /feedback page
 * to avoid duplicates.
 */
export default function FeedbackWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Reset success state when modal re-opens
  useEffect(() => {
    if (open) {
      setSuccess(false);
      setError("");
    }
  }, [open]);

  // Hide on auth pages & on /feedback page (where the full form lives)
  const hiddenOn = ["/login", "/register", "/forgot-password", "/feedback"];
  if (hiddenOn.some((p) => pathname?.startsWith(p))) return null;

  const submit = async () => {
    setError("");
    if (!message.trim()) {
      setError("Please write a comment.");
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
      // Auto-close after 2s
      setTimeout(() => setOpen(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button — hidden on phones (mobile users have bottom nav + can use /feedback) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Send feedback"
          className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-2 h-11 px-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-[0_4px_24px_rgba(16,185,129,0.45)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.65)] hover:scale-105 active:scale-95 transition-all"
        >
          <MessageSquarePlus size={16} />
          Feedback
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center px-0 md:px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            className="w-full md:max-w-md bg-card border border-border md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <MessageSquarePlus size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground leading-tight">Share your feedback</h2>
                  <p className="text-[11px] text-muted-foreground leading-tight">Help us make ICOM better</p>
                </div>
              </div>
              <button
                onClick={() => !sending && setOpen(false)}
                disabled={sending}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {success ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Thanks for the feedback! 🎉</p>
                  <p className="text-xs text-muted-foreground">We read every single submission.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Star rating */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block">
                      How is your experience?
                      <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
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
                              size={26}
                              className={active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
                            />
                          </button>
                        );
                      })}
                      {rating > 0 && (
                        <span className="ml-2 text-xs font-medium text-muted-foreground">
                          {["", "Bad", "Meh", "OK", "Good", "Great"][rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-2 block">
                      Your comment <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you think — bugs, feature ideas, anything!"
                      rows={4}
                      maxLength={2000}
                      className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      {message.length}/2000
                    </p>
                  </div>

                  {/* Anonymous user fields */}
                  {!user && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name (optional)"
                        className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email (optional)"
                        className="bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={submit}
                    disabled={sending || !message.trim()}
                    className="w-full h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Send feedback
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
