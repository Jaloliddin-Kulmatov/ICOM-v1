"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, Clock, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type PendingJob = {
  id: number; title: string; company: string; location: string; salary: string;
  description: string; apply_link: string; created_at: string;
  submitted_by: { id: number; name: string; email: string } | null;
};

/** Part-time jobs shared by students, waiting for an admin to approve or reject them. */
export default function PendingJobsReview({ onChanged }: { onChanged?: () => void }) {
  const [jobs, setJobs] = useState<PendingJob[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await api.get<{ jobs: PendingJob[] }>("/admin/jobs/pending");
    if (data) setJobs(data.jobs); else setError(err || "Couldn't load the review queue.");
  }, []);
  useEffect(() => { load(); }, [load]);

  const review = async (id: number, action: "approve" | "reject") => {
    setBusy(id); setError("");
    const { error: err } = await api.post(`/admin/jobs/${id}/review`, { action });
    setBusy(null);
    if (err) { setError(err); return; }
    setJobs((list) => (list || []).filter((j) => j.id !== id));
    onChanged?.();
  };

  if (jobs === null && !error) return null;
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-amber-600" />
        <h2 className="text-sm font-semibold text-foreground">Part-time jobs to review</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{jobs?.length ?? 0}</span>
      </div>
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
      {jobs && jobs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nothing waiting. Jobs students share appear here before they go live.</p>
      ) : (
        <div className="space-y-3">
          {(jobs || []).map((j) => (
            <div key={j.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{j.title}</p>
                <p className="text-xs text-muted-foreground">{j.company} · {j.location} · {j.salary}</p>
              </div>
              <p className="text-xs text-foreground/80 whitespace-pre-line">{j.description}</p>
              {j.apply_link && (
                <a href={j.apply_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline break-all">
                  {j.apply_link} <ExternalLink size={11} />
                </a>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[11px] text-muted-foreground">
                  Shared by {j.submitted_by ? `${j.submitted_by.name} (${j.submitted_by.email})` : "a deleted account"}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" disabled={busy === j.id} onClick={() => review(j.id, "reject")}><X size={13} /> Reject</Button>
                  <Button size="sm" className="gap-1" disabled={busy === j.id} onClick={() => review(j.id, "approve")}><Check size={13} /> Approve</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
