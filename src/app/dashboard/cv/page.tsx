"use client";

import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { api, uploadFile, downloadFile } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Download, Upload, Trash2, Check, Loader2, UserRound, ShieldCheck, AlertTriangle, RotateCw } from "lucide-react";

// Only the basics employers look for first. Saved next to the uploaded CV
// (backend/routes/cv.py keeps any other fields that were already stored).
type Basics = { full_name: string; headline: string; nationality: string };
type FileMeta = { filename: string; mime: string; size: number; uploaded_at: string };

const NATIONALITIES = [
  "Vietnam", "China", "Uzbekistan", "Nepal", "Mongolia", "Indonesia", "Kazakhstan", "Kyrgyzstan",
  "Tajikistan", "Russia", "India", "Pakistan", "Bangladesh", "Myanmar", "Philippines", "Malaysia",
  "Thailand", "Japan", "Taiwan", "Sri Lanka", "United States", "France", "Germany", "Other",
];

const inputCls =
  "disabled:opacity-60 disabled:cursor-wait w-full h-11 rounded-xl border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring";

export default function CVPage() {
  const { user } = useAuth();
  const [basics, setBasics] = useState<Basics>({ full_name: "", headline: "", nationality: "" });
  const [rest, setRest] = useState<Record<string, unknown>>({});
  const [load, setLoad] = useState<"loading" | "ready" | "failed">("loading");
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [file, setFile] = useState<FileMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dirty = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Latest unsaved data, so a pending save still goes out if the page closes.
  const pending = useRef<Record<string, unknown> | null>(null);

  const userId = user?.id;
  useEffect(() => {
    if (!userId || !user) return;
    let cancelled = false;
    setLoad("loading");
    api.get<{ cv: Record<string, string> | null; file: FileMeta | null }>("/cv/me").then(({ data, error: e }) => {
      if (cancelled) return;
      if (e || !data) {
        // Don't let people type into a form we can't save.
        setLoadError(e || "Couldn't load your CV.");
        setLoad("failed");
        return;
      }
      const cv = data.cv || {};
      setRest(cv);
      setBasics({
        full_name: cv.full_name || user.name || "",
        headline: cv.headline || "",
        nationality: cv.nationality || user.country || "",
      });
      setFile(data.file || null);
      setLoad("ready");
    });
    return () => { cancelled = true; };
    // Reload only when the signed-in person changes, not on every profile refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, attempt]);

  const save = async (body: Record<string, unknown>) => {
    setSaveState("saving");
    const { error: e } = await api.put("/cv/me", body);
    if (pending.current === body) pending.current = null;
    setSaveError(e || "");
    setSaveState(e ? "error" : "saved");
  };

  // Save 0.8 s after the last change.
  useEffect(() => {
    if (load !== "ready" || !dirty.current) return;
    const body = { ...rest, ...basics };
    pending.current = body;
    setSaveState("saving");
    const t = setTimeout(() => save(body), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basics, load, rest]);

  // Leaving the page (or closing the tab) with a save still waiting → send it now.
  useEffect(() => {
    const flush = () => {
      const body = pending.current;
      if (!body) return;
      pending.current = null;
      const token = localStorage.getItem("icon_token");
      fetch(`${API_BASE}/cv/me`, {
        method: "PUT", keepalive: true, body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).catch(() => { /* best effort */ });
    };
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("pagehide", flush); flush(); };
  }, []);

  const set = (k: keyof Basics, v: string) => { dirty.current = true; setBasics((b) => ({ ...b, [k]: v })); };

  const onUpload = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    if (f.size > 2 * 1024 * 1024) { setError("That file is over 2 MB. Please upload a smaller PDF or .docx."); return; }
    setBusy(true);
    const { data, error: e } = await uploadFile<{ file: FileMeta }>("/cv/me/file", "file", f);
    setBusy(false);
    if (e) setError(e); else if (data) setFile(data.file);
    if (fileInput.current) fileInput.current.value = "";
  };
  const onRemove = async () => {
    setBusy(true);
    const { error: e } = await api.delete("/cv/me/file");
    setBusy(false);
    if (e) setError(e); else setFile(null);
  };

  if (!user) {
    return <DashboardLayout><p className="text-sm text-muted-foreground">Sign in to add your CV.</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">My CV</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your CV and add the three things employers look for first.</p>

        {load === "failed" && (
          <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4">
            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Couldn&apos;t load your CV</p>
              <p className="text-xs text-muted-foreground mt-0.5">{loadError.replace(/\.$/, "")}. Nothing was changed.</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setAttempt((n) => n + 1)}>
              <RotateCw size={13} /> Retry
            </Button>
          </div>
        )}

        {/* Upload */}
        <section
          className={`mt-6 rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-colors ${
            dragging ? "border-indigo-500 bg-indigo-500/[0.06]" : "border-border bg-card"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onUpload(e.dataTransfer.files?.[0]); }}
        >
          <input ref={fileInput} type="file" id="cv-file" className="sr-only"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => onUpload(e.target.files?.[0])} />
          {file ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
              <div className="h-12 w-12 rounded-xl bg-coral-500/[0.12] text-coral-600 flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground truncate">{file.filename}</p>
                <p className="text-xs text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB · uploaded {formatRelativeTime(file.uploaded_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1"
                  onClick={async () => { const e = await downloadFile("/cv/me/file", file.filename); if (e) setError(e); }}>
                  <Download size={14} /> Download
                </Button>
                <Button variant="outline" size="sm" className="gap-1" disabled={busy} onClick={() => fileInput.current?.click()}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Replace
                </Button>
                <Button variant="ghost" size="sm" aria-label="Remove CV" disabled={busy} onClick={onRemove}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                <Upload size={24} />
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">Upload your CV</p>
              <p className="text-xs text-muted-foreground mt-1">PDF or Word (.docx), up to 2 MB. Drag it here or choose a file.</p>
              <Button className="mt-4 gap-1.5" disabled={busy} onClick={() => fileInput.current?.click()}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Choose file
              </Button>
            </>
          )}
          {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}
        </section>

        {/* Basics */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center"><UserRound size={15} /></span>
              About you
            </h2>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5" aria-live="polite">
              {load === "ready" && saveState === "saving" && <><Loader2 size={13} className="animate-spin" /> Saving…</>}
              {saveState === "saved" && <><Check size={13} className="text-emerald-600" /> Saved</>}
              {load === "loading" && <><Loader2 size={13} className="animate-spin" /> Loading…</>}
              {saveState === "error" && (
                <button type="button" className="text-red-600 inline-flex items-center gap-1 hover:underline"
                  title={saveError} onClick={() => save({ ...rest, ...basics })}>
                  <RotateCw size={12} /> Couldn&apos;t save. Retry
                </button>
              )}
            </span>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Full name</span>
              <input id="cv-name" disabled={load !== "ready"} className={inputCls} value={basics.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Linh Tran" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/80 mb-1.5">What you do</span>
              <input id="cv-headline" disabled={load !== "ready"} className={inputCls} value={basics.headline} onChange={(e) => set("headline", e.target.value)}
                placeholder="e.g. Marketing student at JBNU, or Backend developer" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Nationality</span>
              <input id="cv-nationality" disabled={load !== "ready"} list="cv-nationalities" className={inputCls} value={basics.nationality}
                onChange={(e) => set("nationality", e.target.value)} placeholder="Vietnam" />
              <datalist id="cv-nationalities">{NATIONALITIES.map((n) => <option key={n} value={n} />)}</datalist>
            </label>
          </div>
        </section>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck size={13} /> Only you can see your CV.
        </p>
      </div>
    </DashboardLayout>
  );
}
