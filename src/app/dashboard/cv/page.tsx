"use client";

import React, { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { api, uploadFile, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Download, Upload, Trash2, Check, Loader2, UserRound, ShieldCheck } from "lucide-react";

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
  "w-full h-11 rounded-xl border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring";

export default function CVPage() {
  const { user } = useAuth();
  const [basics, setBasics] = useState<Basics>({ full_name: "", headline: "", nationality: "" });
  const [rest, setRest] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [file, setFile] = useState<FileMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const dirty = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ cv: Record<string, string> | null; file: FileMeta | null }>("/cv/me").then(({ data }) => {
      const cv = data?.cv || {};
      setRest(cv);
      setBasics({
        full_name: cv.full_name || user.name || "",
        headline: cv.headline || "",
        nationality: cv.nationality || user.country || "",
      });
      setFile(data?.file || null);
      setLoaded(true);
    });
  }, [user]);

  // Save 1 s after the last change.
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      const { error: e } = await api.put("/cv/me", { ...rest, ...basics });
      setSaveState(e ? "error" : "saved");
    }, 1000);
    return () => clearTimeout(t);
  }, [basics, loaded, rest]);

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
              {saveState === "saving" && <><Loader2 size={13} className="animate-spin" /> Saving…</>}
              {saveState === "saved" && <><Check size={13} className="text-emerald-600" /> Saved</>}
              {saveState === "error" && <span className="text-red-600">Couldn&apos;t save</span>}
            </span>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Full name</span>
              <input id="cv-name" className={inputCls} value={basics.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Linh Tran" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/80 mb-1.5">What you do</span>
              <input id="cv-headline" className={inputCls} value={basics.headline} onChange={(e) => set("headline", e.target.value)}
                placeholder="e.g. Marketing student at JBNU, or Backend developer" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-foreground/80 mb-1.5">Nationality</span>
              <input id="cv-nationality" list="cv-nationalities" className={inputCls} value={basics.nationality}
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
