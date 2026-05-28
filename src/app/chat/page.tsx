"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import {
  MessageSquare, Plus, ImageIcon, X, Loader2, Sparkles,
  AlertCircle, ShieldCheck, ArrowRight, Search,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface ChatPost {
  id: number;
  user_id: number;
  author_name: string;
  author_university: string;
  author_country: string;
  title: string;
  content: string;
  image_url: string;
  answer_count: number;
  created_at: string;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null;
}

// Resize a File to a max width of 1024px and return a base64 data URL
// (under ~450KB so it fits inside our backend's 600KB limit).
async function fileToCompressedDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Not a valid image"));
      img.onload = () => {
        const maxW = 1024;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        // Try 0.8 quality; bump down if too big
        let q = 0.8;
        let out = canvas.toDataURL("image/jpeg", q);
        while (out.length > 450_000 && q > 0.3) {
          q -= 0.1;
          out = canvas.toDataURL("image/jpeg", q);
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ChatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat/posts`);
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const visiblePosts = !search
    ? posts
    : posts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-10">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-b from-indigo-500/5 to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <Badge variant="default" className="mb-3 text-xs px-3 py-1 gap-1.5">
              <Sparkles size={11} className="text-violet-400" /> Community Q&A
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
              Ask the community
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Stuck on something? Ask a question — international students who&apos;ve
              been there will share their experience.
            </p>

            <div className="mt-6 flex gap-3 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                />
              </div>
              {user ? (
                <button
                  onClick={() => setShowComposer(true)}
                  className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors flex items-center gap-2 justify-center shrink-0"
                >
                  <Plus size={14} /> Ask a question
                </button>
              ) : (
                <Link
                  href="/login?force=1"
                  className="h-10 px-4 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors flex items-center gap-2 justify-center shrink-0"
                >
                  Sign in to ask
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" />
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search ? `No questions matching "${search}".` : "No questions yet. Be the first to ask!"}
            </div>
          ) : (
            visiblePosts.map((p) => (
              <Link
                key={p.id}
                href={`/chat/${p.id}`}
                className="block p-4 sm:p-5 rounded-2xl border border-border bg-card hover:border-indigo-500/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {p.author_name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 flex-wrap">
                      <span className="font-medium text-foreground">{p.author_name}</span>
                      {p.author_university && <span>· {p.author_university}</span>}
                      {p.author_country && <span>· {p.author_country}</span>}
                      <span>· {formatRelativeTime(p.created_at)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug mb-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                      {p.content}
                    </p>
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="max-h-32 rounded-lg border border-border object-cover mb-2"
                      />
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} />
                        {p.answer_count} {p.answer_count === 1 ? "answer" : "answers"}
                      </span>
                      <span className="flex items-center gap-1 text-indigo-500">
                        Read & answer <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {showComposer && (
        <ComposerModal
          onClose={() => setShowComposer(false)}
          onCreated={(p) => {
            setPosts((prev) => [p, ...prev]);
            setShowComposer(false);
          }}
        />
      )}
    </div>
  );
}

function ComposerModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (post: ChatPost) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleImage = async (file?: File | null) => {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await fileToCompressedDataURL(file);
      setImageUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read image");
    }
  };

  const submit = async () => {
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("Please give your question a title and some context.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/chat/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post your question.");
        return;
      }
      onCreated(data.post);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-xl bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Plus size={15} className="text-indigo-500" /> Ask a question
          </h2>
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How do I pay tuition with a foreign credit card?"
              maxLength={200}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/200</p>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Your question *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share the details — what you've tried, what you're stuck on, where you are in Korea. The more context, the better the answers."
              rows={6}
              maxLength={5000}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{content.length}/5000</p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Add a picture (optional)</label>
            {imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full max-h-48 object-cover rounded-xl border border-border" />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                  type="button"
                  aria-label="Remove image"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-indigo-500/30 hover:text-foreground transition-all">
                <ImageIcon size={14} className="text-indigo-500" />
                Choose an image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              ICOM Chat is a safe space. Posts containing terror, violence, sexual,
              or hate content are automatically blocked and never reach the feed.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-10 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex-1 h-10 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Posting…</>
              ) : (
                <><Plus size={14} /> Post question</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
