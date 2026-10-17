"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/** "Message" button: opens (or reuses) a direct conversation with `userId`. */
export default function MessageButton({ userId, name, className, compact = false }: {
  userId: number; name?: string; className?: string; compact?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (user && user.id === userId) return null;

  const open = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push("/login?force=1"); return; }
    setBusy(true);
    const { data, error } = await api.post<{ conversation: { id: number } }>("/messages/conversations", { user_id: userId });
    setBusy(false);
    if (data) router.push(`/dashboard/messages?c=${data.conversation.id}`);
    else if (error) alert(error);
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      aria-label={name ? `Message ${name}` : "Send a message"}
      className={cn(
        "relative z-10 inline-flex items-center gap-1 rounded-lg font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        compact ? "h-7 px-2 text-[11px]" : "h-8 px-3 text-xs",
        className
      )}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
      Message
    </button>
  );
}
