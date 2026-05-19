"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Bell,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { Post } from "@/types";

const typeConfig = {
  post: { color: "bg-indigo-500/10 border-transparent", icon: null, label: null },
  announcement: {
    color: "border-violet-500/30 bg-violet-500/5",
    icon: Bell,
    label: "Announcement",
    badgeVariant: "violet" as const,
  },
  event: {
    color: "border-blue-500/30 bg-blue-500/5",
    icon: Calendar,
    label: "Event",
    badgeVariant: "cyan" as const,
  },
  alert: {
    color: "border-red-500/30 bg-red-500/5",
    icon: AlertCircle,
    label: "Alert",
    badgeVariant: "destructive" as const,
  },
};

interface PostCardProps {
  post: Post;
  compact?: boolean;
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(post.isSaved ?? false);

  const config = typeConfig[post.type];
  const TypeIcon = config.icon;

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <article
      className={`rounded-2xl border p-5 transition-all duration-200 hover:border-white/15 group ${config.color}`}
    >
      {/* Post type badge */}
      {TypeIcon && config.label && (
        <div className="flex items-center gap-1.5 mb-3">
          <Badge variant={config.badgeVariant ?? "default"} className="gap-1 text-xs">
            <TypeIcon size={11} />
            {config.label}
          </Badge>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 group/author">
          <Avatar size="sm" online={Math.random() > 0.5}>
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>
              {post.author.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground group-hover/author:text-indigo-400 transition-colors">
                {post.author.name}
              </span>
              {post.author.role === "ambassador" && (
                <CheckCircle2 size={13} className="text-indigo-400" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {post.author.university && (
                <>
                  <span>{post.author.university}</span>
                  <span>·</span>
                </>
              )}
              <span>{formatRelativeTime(post.createdAt)}</span>
              {post.author.country && (
                <>
                  <span>·</span>
                  <Globe size={10} />
                  <span>{post.author.country}</span>
                </>
              )}
            </div>
          </div>
        </Link>

        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={15} />
        </Button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className={`text-sm text-foreground/90 leading-relaxed ${compact ? "line-clamp-3" : ""}`}>
          {post.content}
        </p>
        {post.imageUrl && !compact && (
          <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-white/5">
            <img src={post.imageUrl} alt="Post image" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.slice(0, compact ? 2 : undefined).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 cursor-pointer transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/6">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5 ${
              liked ? "text-rose-400" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart
              size={14}
              className={`transition-transform active:scale-125 ${liked ? "fill-rose-400" : ""}`}
            />
            <span>{likeCount}</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <MessageCircle size={14} />
            <span>{post.comments.length}</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <Share2 size={14} />
          </button>
        </div>

        <button
          onClick={() => setSaved((prev) => !prev)}
          className={`p-1.5 rounded-lg transition-all hover:bg-white/5 ${
            saved ? "text-indigo-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark size={14} className={saved ? "fill-indigo-400" : ""} />
        </button>
      </div>
    </article>
  );
}
