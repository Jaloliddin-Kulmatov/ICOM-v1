"use client";

import React, { useState } from "react";
import { Image, Link2, Smile, Globe, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className={`rounded-2xl border transition-all duration-300 p-4 ${
      focused ? "border-indigo-500/40 bg-white/5" : "border-white/8 bg-white/3"
    }`}>
      <div className="flex gap-3">
        <Avatar size="sm">
          <AvatarFallback>JK</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => !content && setFocused(false)}
            placeholder="Share something with the community... (Korean or English)"
            rows={focused ? 3 : 1}
            className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed transition-all duration-200"
          />

          {focused && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8 animate-fade-in">
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                  <Image size={16} />
                </button>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                  <Link2 size={16} />
                </button>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                  <Smile size={16} />
                </button>
                <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground cursor-pointer hover:bg-white/10 transition-colors">
                  <Globe size={11} />
                  <span>Everyone</span>
                </div>
              </div>

              <Button
                size="sm"
                disabled={!content.trim()}
                className="gap-1.5"
              >
                <Send size={13} />
                Post
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
