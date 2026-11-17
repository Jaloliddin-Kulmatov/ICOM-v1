"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Post = { id: number; platform: string; text: string; job_ids: number[]; status: string; error: string; created_at: string };
type Social = { telegram_configured: boolean; next: { count: number; text: string }; history: Post[] };

const RESULT: Record<string, string> = {
  posted: "Posted to Telegram.",
  failed: "Telegram refused the post. See the error below.",
  nothing_new: "No new opportunities to post right now.",
  not_configured: "Telegram isn't connected yet.",
  already_posted: "Already posted today.",
};

/** The daily opportunities post: Telegram status, a preview of the next post, and history. */
export default function SocialPanel() {
  const [s, setS] = useState<Social | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  const load = useCallback(async () => {
    const { data, error: e } = await api.get<Social>("/admin/social");
    if (data) setS(data); else setError(e || "Couldn't load social posts.");
  }, []);
  useEffect(() => { load(); }, [load]);

  const postNow = async () => {
    setBusy(true); setResult("");
    const { data, error: e } = await api.post<{ status: string; error?: string }>("/admin/social/post-now", {});
    setBusy(false);
    setResult(data ? RESULT[data.status] || data.status : e || "Couldn't post.");
    load();
  };

  if (!s) return <p className="text-xs text-muted-foreground">{error || "Loading social posts…"}</p>;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Daily social post</h2>
          <p className="text-[11px] text-muted-foreground">Every day at 09:00 KST, new opportunities go to the ICOM Telegram channel. Links carry ?ref=telegram.</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.telegram_configured ? "text-emerald-600" : "text-amber-600"}`}>
          {s.telegram_configured ? <><CheckCircle2 size={13} /> Telegram connected</> : <><XCircle size={13} /> Telegram not connected</>}
        </span>
      </div>

      {!s.telegram_configured && (
        <ol className="text-xs text-foreground/80 list-decimal pl-5 space-y-1 rounded-xl bg-amber-500/[0.06] border border-amber-500/25 p-3">
          <li>Create a public Telegram channel, for example @icomkorea.</li>
          <li>In Telegram, open @BotFather, send /newbot and follow the steps. Keep the token it gives you private.</li>
          <li>Add the bot to the channel as an administrator that can post messages.</li>
          <li>On Render, add <code>TELEGRAM_BOT_TOKEN</code> (the token) and <code>TELEGRAM_CHANNEL_ID</code> (the @name of the channel).</li>
        </ol>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-xs font-semibold text-foreground">Next post · {s.next.count} {s.next.count === 1 ? "opportunity" : "opportunities"}</p>
          <Button size="sm" className="gap-1.5" onClick={postNow} disabled={busy || !s.telegram_configured || s.next.count === 0}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Post now
          </Button>
        </div>
        {s.next.text ? (
          <pre className="text-[11px] whitespace-pre-wrap rounded-xl bg-muted/50 p-3 max-h-64 overflow-auto font-sans text-foreground/90"
            dangerouslySetInnerHTML={{ __html: s.next.text }} />
        ) : <p className="text-xs text-muted-foreground">Nothing new since the last post. New opportunities from the last 3 days appear here.</p>}
        {result && <p role="status" className="text-xs text-foreground mt-2">{result}</p>}
      </div>

      {s.history.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1.5">Recent posts</p>
          <ul className="space-y-1">
            {s.history.map((p) => (
              <li key={p.id} className="text-xs flex items-center gap-2">
                {p.status === "posted" ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} className="text-red-500" />}
                <span className="text-muted-foreground tabular-nums">{new Date(p.created_at).toLocaleString()}</span>
                <span className="text-foreground">{p.job_ids.length} opportunities</span>
                {p.error && <span className="text-red-500 truncate">· {p.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
