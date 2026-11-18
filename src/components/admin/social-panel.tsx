"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

type Post = { id: number; platform: string; text: string; job_ids: number[]; status: string; error: string; created_at: string };
type Social = {
  telegram_configured: boolean; instagram_configured: boolean; bot_admins: number;
  next: { count: number; text: string; caption: string; card: string }; history: Post[];
};

const RESULT: Record<string, string> = {
  posted: "Posted.",
  failed: "The post failed everywhere. See the error below.",
  nothing_new: "No new opportunities to post right now.",
  not_configured: "No platform is connected yet.",
  already_posted: "Already posted today.",
};

function Status({ on, name }: { on: boolean; name: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${on ? "text-emerald-600" : "text-amber-600"}`}>
      {on ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {name} {on ? "connected" : "not connected"}
    </span>
  );
}

/** The daily opportunities post: platform status, a preview of the next post, and history. */
export default function SocialPanel() {
  const [s, setS] = useState<Social | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [botBusy, setBotBusy] = useState(false);
  const [botResult, setBotResult] = useState("");

  const load = useCallback(async () => {
    const { data, error: e } = await api.get<Social>("/admin/social");
    if (data) setS(data); else setError(e || "Couldn't load social posts.");
  }, []);
  useEffect(() => { load(); }, [load]);

  const postNow = async () => {
    setBusy(true); setResult("");
    const { data, error: e } = await api.post<{ status: string; error?: string }>("/admin/social/post-now", {});
    setBusy(false);
    setResult(data ? `${RESULT[data.status] || data.status}${data.error ? ` ${data.error}` : ""}` : e || "Couldn't post.");
    load();
  };

  const connectBot = async () => {
    setBotBusy(true); setBotResult("");
    const { data, error: e } = await api.post<{ ok: boolean; admins: number }>("/admin/social/telegram-bot", {});
    setBotBusy(false);
    setBotResult(data ? `The bot is on. ${data.admins} admin${data.admins === 1 ? "" : "s"} can send it links.` : e || "Couldn't turn on the bot.");
  };

  if (!s) return <p className="text-xs text-muted-foreground">{error || "Loading social posts…"}</p>;
  const any = s.telegram_configured || s.instagram_configured;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Daily social post</h2>
          <p className="text-[11px] text-muted-foreground">Every day at 09:00 KST, newly approved opportunities go to Telegram and Instagram with pictures. The Telegram style changes daily: a list picture, an album of cards, or one spotlight.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Status on={s.telegram_configured} name="Telegram" />
          <Status on={s.instagram_configured} name="Instagram" />
        </div>
      </div>

      {!s.telegram_configured && (
        <details className="text-xs rounded-xl bg-amber-500/[0.06] border border-amber-500/25 p-3">
          <summary className="font-semibold cursor-pointer">How to connect Telegram</summary>
          <ol className="list-decimal pl-5 space-y-1 mt-2 text-foreground/80">
            <li>Create a public Telegram channel, for example @icomkorea.</li>
            <li>In Telegram, open @BotFather, send /newbot and follow the steps. Keep the token it gives you private.</li>
            <li>Add the bot to the channel as an administrator that can post messages.</li>
            <li>On Render, add <code>TELEGRAM_BOT_TOKEN</code> (the token) and <code>TELEGRAM_CHANNEL_ID</code> (the @name of the channel).</li>
          </ol>
        </details>
      )}
      {!s.instagram_configured && (
        <details className="text-xs rounded-xl bg-amber-500/[0.06] border border-amber-500/25 p-3">
          <summary className="font-semibold cursor-pointer">How to connect Instagram</summary>
          <ol className="list-decimal pl-5 space-y-1 mt-2 text-foreground/80">
            <li>In the Instagram app, switch the ICOM account to a Professional (Business or Creator) account.</li>
            <li>Create a Facebook Page for ICOM and link the Instagram account to it.</li>
            <li>At developers.facebook.com, create an app, add the Instagram API, and get a long-lived access token with the <code>instagram_content_publish</code> permission, plus the Instagram account&apos;s user id.</li>
            <li>On Render, add <code>INSTAGRAM_USER_ID</code> and <code>INSTAGRAM_ACCESS_TOKEN</code>. Keep the token private.</li>
          </ol>
        </details>
      )}

      {s.telegram_configured && (
        <div className="rounded-xl border border-border p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground">Telegram bot: send a link, it goes on ICOM and the channel</p>
              <p className="text-[11px] text-muted-foreground">
                {s.bot_admins > 0 ? `${s.bot_admins} admin${s.bot_admins === 1 ? "" : "s"} can send links.` : "No admins set yet."}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={connectBot} disabled={botBusy}>
              {botBusy ? <Loader2 size={13} className="animate-spin" /> : null} Turn on the bot
            </Button>
          </div>
          <ol className="text-[11px] text-foreground/80 list-decimal pl-5 space-y-0.5">
            <li>Open your bot in Telegram and send <code>/start</code>. It replies with your Telegram id.</li>
            <li>On Render, add <code>TELEGRAM_ADMIN_IDS</code> with that id (several ids: separate with commas).</li>
            <li>Press <b>Turn on the bot</b> once. Then send the bot any opportunity link.</li>
          </ol>
          {botResult && <p role="status" className="text-xs text-foreground">{botResult}</p>}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-foreground">Next post · {s.next.count} {s.next.count === 1 ? "opportunity" : "opportunities"}</p>
          <Button size="sm" className="gap-1.5" onClick={postNow} disabled={busy || !any || s.next.count === 0}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Post now
          </Button>
        </div>
        {s.next.count > 0 ? (
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground">Telegram</p>
              <pre className="text-[11px] whitespace-pre-wrap rounded-xl bg-muted/50 p-3 max-h-64 overflow-auto font-sans text-foreground/90"
                dangerouslySetInnerHTML={{ __html: s.next.text }} />
              <p className="text-[11px] font-semibold text-muted-foreground">Instagram caption</p>
              <pre className="text-[11px] whitespace-pre-wrap rounded-xl bg-muted/50 p-3 max-h-40 overflow-auto font-sans text-foreground/90">{s.next.caption}</pre>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">Instagram picture</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${API}${s.next.card}`} alt="The picture Instagram will show" className="w-full rounded-xl border border-border" />
            </div>
          </div>
        ) : <p className="text-xs text-muted-foreground">Nothing new since the last post. Opportunities approved in the last 3 days appear here.</p>}
        {result && <p role="status" className="text-xs text-foreground mt-2">{result}</p>}
      </div>

      {s.history.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1.5">Recent posts</p>
          <ul className="space-y-1">
            {s.history.map((p) => (
              <li key={p.id} className="text-xs flex items-center gap-2">
                {p.status === "posted" ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} className="text-red-500" />}
                <span className="capitalize text-foreground w-16">{p.platform}</span>
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
