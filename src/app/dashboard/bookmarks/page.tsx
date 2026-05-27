"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import JobCard from "@/components/jobs/job-card";
import { Bookmark, Briefcase, Globe, Trash2, MessageSquare } from "lucide-react";
import { Bookmarks, type SavedPost } from "@/lib/bookmarks";
import { formatRelativeTime } from "@/lib/utils";
import type { Job } from "@/types";
import Link from "next/link";

export default function BookmarksPage() {
  const [tab, setTab] = useState<"jobs" | "posts">("jobs");
  const [jobs, setJobs]   = useState<Job[]>([]);
  const [posts, setPosts] = useState<SavedPost[]>([]);

  const refresh = useCallback(() => {
    setJobs(Bookmarks.jobs.getAll());
    setPosts(Bookmarks.posts.getAll());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("bookmarks-changed", refresh);
    return () => window.removeEventListener("bookmarks-changed", refresh);
  }, [refresh]);

  const removePost = (id: number) => {
    const post = posts.find(p => p.id === id);
    if (post) Bookmarks.posts.toggle(post);
  };

  const total = jobs.length + posts.length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Bookmark size={18} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Saved</h1>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${total} saved item${total !== 1 ? "s" : ""}` : "Your bookmarked jobs and posts"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mb-5 border-b border-border">
          {([
            { key: "jobs",  icon: Briefcase, label: "Jobs",  count: jobs.length  },
            { key: "posts", icon: Globe,     label: "Posts", count: posts.length },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.key
                  ? "border-indigo-500 text-indigo-500 dark:text-indigo-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {t.count > 0 && (
                <span className="ml-0.5 text-[10px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Jobs tab */}
        {tab === "jobs" && (
          jobs.length === 0 ? (
            <Empty
              icon={<Briefcase size={28} className="text-muted-foreground/30" />}
              title="No saved jobs"
              sub="Hit the bookmark icon on any internship to save it here."
              href="/jobs"
              cta="Browse internships"
            />
          ) : (
            <div className="space-y-3">
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )
        )}

        {/* Posts tab */}
        {tab === "posts" && (
          posts.length === 0 ? (
            <Empty
              icon={<MessageSquare size={28} className="text-muted-foreground/30" />}
              title="No saved posts"
              sub="Hit the Save button on any community post to find it here."
              href="/community"
              cta="Browse community"
            />
          ) : (
            <div className="space-y-3">
              {posts.map(p => (
                <div key={p.id} className="group p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                        p.posted_as_type === "university" ? "bg-gradient-to-br from-indigo-500 to-violet-600" :
                        p.posted_as_type === "club"       ? "bg-gradient-to-br from-emerald-500 to-cyan-600" :
                        p.posted_as_type === "community"  ? "bg-gradient-to-br from-violet-500 to-purple-600" :
                                                            "bg-gradient-to-br from-slate-500 to-slate-700"
                      }`}>
                        {(p.posted_as_label || p.author_name)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-none">
                          {p.posted_as_label || p.author_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(p.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removePost(p.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                      title="Remove bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                    {p.content}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}

function Empty({ icon, title, sub, href, cta }: {
  icon: React.ReactNode; title: string; sub: string; href: string; cta: string;
}) {
  return (
    <div className="py-16 rounded-2xl border border-white/8 bg-white/3 text-center space-y-3">
      <div className="flex justify-center">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
      >
        {cta} →
      </Link>
    </div>
  );
}
