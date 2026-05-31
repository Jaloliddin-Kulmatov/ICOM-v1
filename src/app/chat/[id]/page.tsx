"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import {
  ArrowLeft, Loader2, MessageSquare, Send,
  AlertCircle, Trash2, ShieldCheck, CornerDownRight, X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Answer {
  id: number;
  post_id: number;
  user_id: number;
  author_name: string;
  author_university: string;
  author_country: string;
  content: string;
  created_at: string;
}

interface PostDetail {
  id: number;
  user_id: number;
  author_name: string;
  author_university: string;
  author_country: string;
  title: string;
  content: string;
  image_url: string;
  answer_count: number;
  answers: Answer[];
  created_at: string;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

export default function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/chat/posts/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load this question.");
        return;
      }
      setPost(data.post);
    } catch {
      setError("Network error. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const submitAnswer = async () => {
    if (!reply.trim() || submitting) return;
    setReplyError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/chat/posts/${id}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyError(data.error || "Could not post your answer.");
        return;
      }
      // Append the new answer locally so we don't have to refetch the whole post
      setPost((p) =>
        p ? { ...p, answers: [...p.answers, data.answer], answer_count: p.answer_count + 1 } : p
      );
      setReply("");
      setReplyingTo(null);
    } catch {
      setReplyError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startReply = (answer: Answer) => {
    setReplyingTo({ id: answer.id, name: answer.author_name });
    // Prepend @mention only if not already there
    const mention = `@${answer.author_name}: `;
    setReply((prev) => (prev.startsWith(`@${answer.author_name}`) ? prev : mention));
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReply("");
  };

  const deleteAnswer = async (answerId: number) => {
    if (!confirm("Remove this answer?")) return;
    const res = await fetch(`${API}/chat/answers/${answerId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok && post) {
      setPost({
        ...post,
        answers: post.answers.filter((a) => a.id !== answerId),
        answer_count: Math.max(0, post.answer_count - 1),
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-24 text-center">
          <AlertCircle size={28} className="text-muted-foreground/40 mx-auto mb-3" />
          <h1 className="text-base font-semibold text-foreground mb-2">
            This question is gone
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "It may have been removed or never existed."}
          </p>
          <Link
            href="/chat"
            className="text-sm px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={13} /> Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors"
          >
            <ArrowLeft size={13} /> Back to all questions
          </Link>

          {/* Question */}
          <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {post.author_name[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 flex-wrap">
                  <span className="font-medium text-foreground">{post.author_name}</span>
                  {post.author_university && <span>· {post.author_university}</span>}
                  {post.author_country && <span>· {post.author_country}</span>}
                  <span>· {formatRelativeTime(post.created_at)}</span>
                </div>
                <h1 className="text-xl font-bold text-foreground leading-snug">{post.title}</h1>
              </div>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mb-4">
              {post.content}
            </p>

            {post.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.image_url}
                alt=""
                className="w-full max-h-96 object-contain rounded-xl border border-border bg-muted"
              />
            )}
          </div>

          {/* Answers header */}
          <div className="flex items-center gap-2 mt-8 mb-4">
            <MessageSquare size={15} className="text-indigo-500" />
            <h2 className="text-sm font-bold text-foreground">
              {post.answer_count} {post.answer_count === 1 ? "Answer" : "Answers"}
            </h2>
          </div>

          {/* Answers */}
          {post.answers.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
              No answers yet. Be the first to help!
            </div>
          ) : (
            <div className="space-y-3">
              {post.answers.map((a) => (
                <div key={a.id} className="p-4 sm:p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {a.author_name[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2 flex-wrap">
                        <span className="font-medium text-foreground">{a.author_name}</span>
                        {a.author_university && <span>· {a.author_university}</span>}
                        {a.author_country && <span>· {a.author_country}</span>}
                        <span>· {formatRelativeTime(a.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {a.content}
                      </p>

                      {/* Reply button — show for all signed-in users except the answer author */}
                      {user && (
                        <button
                          onClick={() => startReply(a)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-indigo-400 transition-colors"
                        >
                          <CornerDownRight size={11} />
                          Reply
                        </button>
                      )}
                    </div>
                    {user?.id === a.user_id && (
                      <button
                        onClick={() => deleteAnswer(a.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                        title="Delete your answer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply form */}
          {user ? (
            <div className="mt-8 p-4 sm:p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">
                  {replyingTo ? `Replying to @${replyingTo.name}` : "Share your answer"}
                </h3>
                {replyingTo && (
                  <button
                    onClick={cancelReply}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={12} /> Cancel reply
                  </button>
                )}
              </div>

              {/* "Replying to" pill */}
              {replyingTo && (
                <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20 w-fit">
                  <CornerDownRight size={11} className="text-indigo-400" />
                  <span className="text-[11px] text-indigo-400 font-medium">@{replyingTo.name}</span>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.name}…`
                    : "Help out by sharing what worked for you, links to official resources, or things to watch out for…"
                }
                rows={4}
                maxLength={3000}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-2 gap-3">
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-500" />
                  Be respectful — abusive content is blocked.
                </p>
                <p className="text-[10px] text-muted-foreground">{reply.length}/3000</p>
              </div>
              {replyError && (
                <div className="flex items-start gap-2 p-3 mt-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{replyError}</span>
                </div>
              )}
              <button
                onClick={submitAnswer}
                disabled={submitting || !reply.trim()}
                className="mt-3 h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Posting…</>
                ) : replyingTo ? (
                  <><CornerDownRight size={14} /> Post reply</>
                ) : (
                  <><Send size={14} /> Post answer</>
                )}
              </button>
            </div>
          ) : (
            <div className="mt-8 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-center">
              <p className="text-sm text-foreground mb-2">Sign in to share your answer</p>
              <Link
                href="/login?force=1"
                className="inline-block h-10 px-5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors leading-10"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
