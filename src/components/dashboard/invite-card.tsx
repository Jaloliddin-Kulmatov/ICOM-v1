"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, Share2, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { shareLink } from "@/lib/invite";

type Invite = { code: string; link: string; joined: number };

/** The student's personal invite link and how many friends joined with it. */
export default function InviteCard() {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [done, setDone] = useState<"" | "copied" | "shared">("");

  useEffect(() => {
    api.get<Invite>("/invites/me").then(({ data }) => data && setInvite(data));
  }, []);
  if (!invite) return null;

  const share = async () => {
    const r = await shareLink(invite.link, "Join me on ICOM, the app for international students in Korea:");
    if (r !== "failed") { setDone(r); setTimeout(() => setDone(""), 2500); }
  };

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="h-11 w-11 shrink-0 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><UserPlus size={20} /></span>
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-bold text-foreground">Invite friends to ICOM</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {invite.joined > 0
            ? `${invite.joined} ${invite.joined === 1 ? "friend has" : "friends have"} joined with your link. Thank you!`
            : "Share your link in your class or country group chat. You'll see here who joins."}
        </p>
        <p className="mt-2 text-xs font-mono text-foreground truncate bg-muted/50 rounded-lg px-2.5 py-1.5 w-fit max-w-full">{invite.link}</p>
      </div>
      <button onClick={share}
        className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-indigo-700 shrink-0">
        {done ? <><Check size={15} /> {done === "copied" ? "Link copied" : "Shared"}</> : <>{typeof navigator !== "undefined" && "share" in navigator ? <Share2 size={15} /> : <Copy size={15} />} Share link</>}
      </button>
    </section>
  );
}
