"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { api, uploadFile, downloadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import {
  FileText, Download, Upload, Trash2, Plus, X, Check, Loader2, Eye, PenLine, Lightbulb,
  GraduationCap, Briefcase, Languages, Award, Link2, Sparkles, UserRound,
} from "lucide-react";

// ── Data shape (mirrors backend/routes/cv.py) ─────────────────────────────────
type Edu = { school: string; degree: string; field: string; start: string; end: string; details: string };
type Exp = { title: string; company: string; location: string; start: string; end: string; details: string };
type Lang = { name: string; level: string };
type Cert = { name: string; year: string };
type LinkItem = { label: string; url: string };
type CV = {
  full_name: string; headline: string; email: string; phone: string; location: string; visa: string;
  summary: string; education: Edu[]; experience: Exp[]; skills: string[];
  languages: Lang[]; certifications: Cert[]; links: LinkItem[];
};
type FileMeta = { filename: string; mime: string; size: number; uploaded_at: string };

const EMPTY: CV = {
  full_name: "", headline: "", email: "", phone: "", location: "", visa: "", summary: "",
  education: [], experience: [], skills: [], languages: [], certifications: [], links: [],
};
const blankEdu: Edu = { school: "", degree: "", field: "", start: "", end: "", details: "" };
const blankExp: Exp = { title: "", company: "", location: "", start: "", end: "", details: "" };
const LEVELS = ["Native", "Fluent", "Business", "Conversational", "Basic"];
const VISAS = ["", "D-2 (Student)", "D-4 (Language)", "D-10 (Job seeker)", "E-7 (Professional)", "F-2 (Resident)", "F-4", "F-5 (Permanent)", "F-6"];

// ── Small form pieces ─────────────────────────────────────────────────────────
const inputCls =
  "w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="block text-xs font-semibold text-foreground/80 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

function Section({ icon: Icon, title, children, action }: {
  icon: React.ElementType; title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <span className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <Icon size={15} />
          </span>
          {title}
        </h2>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Plus size={14} /> {label}
    </button>
  );
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <X size={14} />
    </button>
  );
}

// ── The printable CV ──────────────────────────────────────────────────────────
function CVPreview({ cv }: { cv: CV }) {
  const dates = (s: string, e: string) => [s, e || (s ? "Present" : "")].filter(Boolean).join(" – ");
  const contact = [cv.email, cv.phone, cv.location, cv.visa && `Visa: ${cv.visa}`].filter(Boolean);
  const H = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00703a] border-b border-[#d9dfd6] pb-1 mb-2 mt-5 first:mt-0">{children}</h3>
  );
  return (
    <article id="cv-print" className="cv-paper bg-white text-[#16213a] shadow-sm ring-1 ring-black/5 rounded-md p-[7%] text-[12.5px] leading-relaxed font-sans">
      <header className="mb-4">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">{cv.full_name || "Your name"}</h1>
        {cv.headline && <p className="text-[14px] font-semibold text-[#3d527d] mt-0.5">{cv.headline}</p>}
        {contact.length > 0 && <p className="text-[11.5px] text-[#4f6799] mt-1.5">{contact.join("  ·  ")}</p>}
        {cv.links.length > 0 && (
          <p className="text-[11.5px] text-[#00703a] mt-0.5 break-all">
            {cv.links.map((l) => l.label ? `${l.label}: ${l.url.replace(/^https?:\/\//, "")}` : l.url.replace(/^https?:\/\//, "")).join("  ·  ")}
          </p>
        )}
      </header>

      {cv.summary && (<><H>Profile</H><p className="whitespace-pre-line">{cv.summary}</p></>)}

      {cv.experience.length > 0 && (<>
        <H>Experience</H>
        <div className="space-y-3">
          {cv.experience.map((e, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="flex justify-between gap-3">
                <p className="font-bold">{e.title}{e.company && <span className="font-semibold text-[#3d527d]"> · {e.company}</span>}</p>
                <p className="text-[11px] text-[#4f6799] whitespace-nowrap">{dates(e.start, e.end)}</p>
              </div>
              {e.location && <p className="text-[11px] text-[#4f6799]">{e.location}</p>}
              {e.details && <p className="whitespace-pre-line mt-0.5">{e.details}</p>}
            </div>
          ))}
        </div>
      </>)}

      {cv.education.length > 0 && (<>
        <H>Education</H>
        <div className="space-y-3">
          {cv.education.map((e, i) => (
            <div key={i} className="break-inside-avoid">
              <div className="flex justify-between gap-3">
                <p className="font-bold">{e.school}</p>
                <p className="text-[11px] text-[#4f6799] whitespace-nowrap">{dates(e.start, e.end)}</p>
              </div>
              {(e.degree || e.field) && <p className="text-[#3d527d]">{[e.degree, e.field].filter(Boolean).join(", ")}</p>}
              {e.details && <p className="whitespace-pre-line mt-0.5">{e.details}</p>}
            </div>
          ))}
        </div>
      </>)}

      {(cv.skills.length > 0 || cv.languages.length > 0) && (
        <div className="grid grid-cols-2 gap-x-6">
          {cv.skills.length > 0 && (<div><H>Skills</H><p>{cv.skills.join(" · ")}</p></div>)}
          {cv.languages.length > 0 && (
            <div><H>Languages</H>
              <ul>{cv.languages.map((l, i) => <li key={i}><span className="font-semibold">{l.name}</span>{l.level && ` — ${l.level}`}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {cv.certifications.length > 0 && (<>
        <H>Certificates</H>
        <ul>{cv.certifications.map((c, i) => <li key={i}>{c.name}{c.year && <span className="text-[#4f6799]"> ({c.year})</span>}</li>)}</ul>
      </>)}
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CVPage() {
  const { user } = useAuth();
  const [cv, setCv] = useState<CV>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [file, setFile] = useState<FileMeta | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [fileError, setFileError] = useState("");
  const [skillDraft, setSkillDraft] = useState("");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const dirty = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Load, prefilling from the profile the first time.
  useEffect(() => {
    if (!user) return;
    api.get<{ cv: Partial<CV> | null; updated_at: string | null; file: FileMeta | null }>("/cv/me").then(({ data }) => {
      if (data?.cv) setCv({ ...EMPTY, ...data.cv });
      else setCv({ ...EMPTY, full_name: user.name || "", email: user.email || "", location: user.country ? `From ${user.country}` : "" });
      setSavedAt(data?.updated_at || null);
      setFile(data?.file || null);
      setLoaded(true);
    });
  }, [user]);

  // Autosave 1.2 s after the last change.
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      const { data, error } = await api.put<{ updated_at: string }>("/cv/me", cv);
      if (error) setSaveState("error");
      else { setSaveState("saved"); setSavedAt(data?.updated_at || new Date().toISOString()); }
    }, 1200);
    return () => clearTimeout(t);
  }, [cv, loaded]);

  const update = useCallback(<K extends keyof CV>(key: K, value: CV[K]) => {
    dirty.current = true;
    setCv((prev) => ({ ...prev, [key]: value }));
  }, []);
  function updateRow<K extends "education" | "experience" | "languages" | "certifications" | "links">(
    key: K, i: number, patch: Partial<CV[K][number]>
  ) {
    update(key, cv[key].map((row, j) => (j === i ? { ...row, ...patch } : row)) as CV[K]);
  }
  const addSkill = () => {
    const parts = skillDraft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) update("skills", Array.from(new Set([...cv.skills, ...parts])).slice(0, 40));
    setSkillDraft("");
  };

  const onUpload = async (f: File | undefined) => {
    if (!f) return;
    setFileError("");
    if (f.size > 2 * 1024 * 1024) { setFileError("That file is over 2 MB. Please upload a smaller PDF or .docx."); return; }
    setFileBusy(true);
    const { data, error } = await uploadFile<{ file: FileMeta }>("/cv/me/file", "file", f);
    setFileBusy(false);
    if (error) setFileError(error);
    else setFile(data!.file);
    if (fileInput.current) fileInput.current.value = "";
  };
  const onRemoveFile = async () => {
    setFileBusy(true);
    const { error } = await api.delete("/cv/me/file");
    setFileBusy(false);
    if (error) setFileError(error); else setFile(null);
  };

  const filled = [cv.full_name, cv.headline, cv.summary].filter(Boolean).length
    + (cv.education.length ? 1 : 0) + (cv.experience.length ? 1 : 0) + (cv.skills.length ? 1 : 0) + (cv.languages.length ? 1 : 0);
  const progress = Math.round((filled / 7) * 100);

  if (!user) {
    return <DashboardLayout><p className="text-sm text-muted-foreground">Sign in to build your CV.</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="cv-no-print flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">My CV</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build a clean English CV for Korean companies, or upload the one you already have.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5" aria-live="polite">
            {saveState === "saving" && <><Loader2 size={13} className="animate-spin" /> Saving…</>}
            {saveState === "saved" && <><Check size={13} className="text-emerald-600" /> Saved</>}
            {saveState === "error" && <span className="text-red-600">Couldn&apos;t save. Check your connection.</span>}
            {saveState === "idle" && savedAt && <>Saved {formatRelativeTime(savedAt)}</>}
          </span>
          <Button onClick={() => window.print()} className="gap-1.5">
            <Download size={15} /> Download PDF
          </Button>
        </div>
      </div>

      {/* Uploaded CV + completeness */}
      <div className="cv-no-print grid md:grid-cols-[1fr_280px] gap-4 mb-6">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-wrap items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-coral-500/[0.12] text-coral-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-sm font-bold text-foreground">Already have a CV?</p>
            {file ? (
              <p className="text-xs text-muted-foreground truncate">
                <span className="font-semibold text-foreground/80">{file.filename}</span> · {(file.size / 1024).toFixed(0)} KB · uploaded {formatRelativeTime(file.uploaded_at)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Upload a PDF or Word (.docx) file, up to 2 MB. Only you can see it.</p>
            )}
            {fileError && <p className="text-xs text-red-600 mt-1" role="alert">{fileError}</p>}
          </div>
          <input ref={fileInput} type="file" id="cv-file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
          <div className="flex items-center gap-2 flex-wrap">
            {file && (
              <>
                <Button variant="outline" size="sm" className="gap-1" onClick={async () => { const e = await downloadFile("/cv/me/file", file.filename); if (e) setFileError(e); }}>
                  <Download size={14} /> Download
                </Button>
                <Button variant="ghost" size="sm" aria-label="Remove uploaded CV" onClick={onRemoveFile} disabled={fileBusy}>
                  <Trash2 size={14} />
                </Button>
              </>
            )}
            <Button size="sm" variant={file ? "outline" : "default"} className="gap-1" disabled={fileBusy}
              onClick={() => fileInput.current?.click()}>
              {fileBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {file ? "Replace" : "Upload CV"}
            </Button>
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-foreground">CV builder progress</span>
            <span className="text-indigo-700 dark:text-indigo-300 tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden" aria-hidden>
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Add a headline, summary, education, experience, skills and languages.</p>
        </section>
      </div>

      {/* Mobile tabs */}
      <div className="cv-no-print lg:hidden flex rounded-xl border border-border bg-card p-1 mb-4" role="tablist">
        {([["edit", "Edit", PenLine], ["preview", "Preview", Eye]] as const).map(([k, label, Icon]) => (
          <button key={k} role="tab" aria-selected={mobileTab === k} onClick={() => setMobileTab(k)}
            className={`flex-1 h-9 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${mobileTab === k ? "bg-indigo-600 text-white" : "text-muted-foreground"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Editor */}
        <div className={`cv-no-print space-y-4 ${mobileTab === "edit" ? "" : "hidden lg:block"}`}>
          <Section icon={UserRound} title="Basics">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full name"><input id="cv-name" className={inputCls} value={cv.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Linh Tran" /></Field>
              <Field label="Headline"><input id="cv-headline" className={inputCls} value={cv.headline} onChange={(e) => update("headline", e.target.value)} placeholder="Marketing student at JBNU" /></Field>
              <Field label="Email"><input id="cv-email" type="email" className={inputCls} value={cv.email} onChange={(e) => update("email", e.target.value)} /></Field>
              <Field label="Phone"><input id="cv-phone" className={inputCls} value={cv.phone} onChange={(e) => update("phone", e.target.value)} placeholder="010-1234-5678" /></Field>
              <Field label="Location"><input id="cv-location" className={inputCls} value={cv.location} onChange={(e) => update("location", e.target.value)} placeholder="Jeonju, Korea" /></Field>
              <Field label="Visa" hint="Employers in Korea always ask. Saying it up front saves time.">
                <select id="cv-visa" className={inputCls} value={cv.visa} onChange={(e) => update("visa", e.target.value)}>
                  {VISAS.map((v) => <option key={v} value={v}>{v || "Choose your visa"}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section icon={Sparkles} title="Profile summary">
            <Field label="2–4 sentences about you" hint={`${cv.summary.length}/2000`}>
              <textarea id="cv-summary" rows={4} className={`${inputCls} h-auto py-2 resize-y`} value={cv.summary}
                onChange={(e) => update("summary", e.target.value.slice(0, 2000))}
                placeholder="Business student from Vietnam with a year of social-media marketing experience. Looking for a marketing internship in Seoul or Jeonju." />
            </Field>
          </Section>

          <Section icon={Briefcase} title="Experience" action={<AddButton label="Add experience" onClick={() => update("experience", [...cv.experience, { ...blankExp }])} />}>
            {cv.experience.length === 0 && <p className="text-xs text-muted-foreground">Part-time jobs, internships, volunteering and club roles all count.</p>}
            {cv.experience.map((e, i) => (
              <div key={i} className="rounded-xl border border-border p-3 space-y-3">
                <div className="flex justify-end -mt-1 -mr-1"><RemoveButton label={`Remove experience ${i + 1}`} onClick={() => update("experience", cv.experience.filter((_, j) => j !== i))} /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Role"><input id={`cv-exp-title-${i}`} className={inputCls} value={e.title} onChange={(ev) => updateRow("experience", i, { title: ev.target.value })} placeholder="Marketing intern" /></Field>
                  <Field label="Company"><input id={`cv-exp-company-${i}`} className={inputCls} value={e.company} onChange={(ev) => updateRow("experience", i, { company: ev.target.value })} /></Field>
                  <Field label="Start"><input id={`cv-exp-start-${i}`} className={inputCls} value={e.start} onChange={(ev) => updateRow("experience", i, { start: ev.target.value })} placeholder="2025.03" /></Field>
                  <Field label="End"><input id={`cv-exp-end-${i}`} className={inputCls} value={e.end} onChange={(ev) => updateRow("experience", i, { end: ev.target.value })} placeholder="Leave empty if current" /></Field>
                </div>
                <Field label="What you did"><textarea id={`cv-exp-details-${i}`} rows={3} className={`${inputCls} h-auto py-2`} value={e.details} onChange={(ev) => updateRow("experience", i, { details: ev.target.value })} placeholder="• Grew Instagram followers from 2k to 9k in 4 months" /></Field>
              </div>
            ))}
          </Section>

          <Section icon={GraduationCap} title="Education" action={<AddButton label="Add school" onClick={() => update("education", [...cv.education, { ...blankEdu }])} />}>
            {cv.education.length === 0 && <p className="text-xs text-muted-foreground">Start with your current university, then any earlier degrees or language schools.</p>}
            {cv.education.map((e, i) => (
              <div key={i} className="rounded-xl border border-border p-3 space-y-3">
                <div className="flex justify-end -mt-1 -mr-1"><RemoveButton label={`Remove education ${i + 1}`} onClick={() => update("education", cv.education.filter((_, j) => j !== i))} /></div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="School"><input id={`cv-edu-school-${i}`} className={inputCls} value={e.school} onChange={(ev) => updateRow("education", i, { school: ev.target.value })} placeholder="Jeonbuk National University" /></Field>
                  <Field label="Degree"><input id={`cv-edu-degree-${i}`} className={inputCls} value={e.degree} onChange={(ev) => updateRow("education", i, { degree: ev.target.value })} placeholder="Bachelor's" /></Field>
                  <Field label="Major"><input id={`cv-edu-field-${i}`} className={inputCls} value={e.field} onChange={(ev) => updateRow("education", i, { field: ev.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start"><input id={`cv-edu-start-${i}`} className={inputCls} value={e.start} onChange={(ev) => updateRow("education", i, { start: ev.target.value })} placeholder="2023" /></Field>
                    <Field label="End"><input id={`cv-edu-end-${i}`} className={inputCls} value={e.end} onChange={(ev) => updateRow("education", i, { end: ev.target.value })} placeholder="2027" /></Field>
                  </div>
                </div>
                <Field label="Details (optional)"><input id={`cv-edu-details-${i}`} className={inputCls} value={e.details} onChange={(ev) => updateRow("education", i, { details: ev.target.value })} placeholder="GPA 4.0/4.5 · Global Korea Scholarship" /></Field>
              </div>
            ))}
          </Section>

          <Section icon={Sparkles} title="Skills">
            <div className="flex gap-2">
              <input id="cv-skill" className={inputCls} value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} placeholder="Type a skill and press Enter" />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            {cv.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cv.skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-md bg-secondary text-xs font-semibold text-foreground/80">
                    {s}
                    <button type="button" aria-label={`Remove ${s}`} onClick={() => update("skills", cv.skills.filter((x) => x !== s))} className="p-0.5 rounded hover:bg-accent"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section icon={Languages} title="Languages" action={<AddButton label="Add language" onClick={() => update("languages", [...cv.languages, { name: "", level: "Fluent" }])} />}>
            {cv.languages.length === 0 && <p className="text-xs text-muted-foreground">Add Korean with your TOPIK level, e.g. &quot;Korean (TOPIK 4)&quot;. Korean employers look for it first.</p>}
            {cv.languages.map((l, i) => (
              <div key={i} className="flex items-end gap-2">
                <Field label="Language"><input id={`cv-lang-${i}`} className={inputCls} value={l.name} onChange={(e) => updateRow("languages", i, { name: e.target.value })} placeholder="Korean (TOPIK 4)" /></Field>
                <Field label="Level">
                  <select id={`cv-lang-level-${i}`} className={inputCls} value={l.level} onChange={(e) => updateRow("languages", i, { level: e.target.value })}>
                    {LEVELS.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <div className="pb-1.5"><RemoveButton label={`Remove language ${i + 1}`} onClick={() => update("languages", cv.languages.filter((_, j) => j !== i))} /></div>
              </div>
            ))}
          </Section>

          <Section icon={Award} title="Certificates" action={<AddButton label="Add certificate" onClick={() => update("certifications", [...cv.certifications, { name: "", year: "" }])} />}>
            {cv.certifications.length === 0 && <p className="text-xs text-muted-foreground">TOPIK, KIIP, IELTS, Google certificates, awards.</p>}
            {cv.certifications.map((c, i) => (
              <div key={i} className="flex items-end gap-2">
                <Field label="Name"><input id={`cv-cert-${i}`} className={inputCls} value={c.name} onChange={(e) => updateRow("certifications", i, { name: e.target.value })} /></Field>
                <div className="w-24 shrink-0"><Field label="Year"><input id={`cv-cert-year-${i}`} className={inputCls} value={c.year} onChange={(e) => updateRow("certifications", i, { year: e.target.value })} /></Field></div>
                <div className="pb-1.5"><RemoveButton label={`Remove certificate ${i + 1}`} onClick={() => update("certifications", cv.certifications.filter((_, j) => j !== i))} /></div>
              </div>
            ))}
          </Section>

          <Section icon={Link2} title="Links" action={<AddButton label="Add link" onClick={() => update("links", [...cv.links, { label: "", url: "" }])} />}>
            {cv.links.length === 0 && <p className="text-xs text-muted-foreground">LinkedIn, portfolio, GitHub.</p>}
            {cv.links.map((l, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="w-32 shrink-0"><Field label="Label"><input id={`cv-link-label-${i}`} className={inputCls} value={l.label} onChange={(e) => updateRow("links", i, { label: e.target.value })} placeholder="LinkedIn" /></Field></div>
                <Field label="Address"><input id={`cv-link-url-${i}`} className={inputCls} value={l.url} onChange={(e) => updateRow("links", i, { url: e.target.value })} placeholder="linkedin.com/in/…" /></Field>
                <div className="pb-1.5"><RemoveButton label={`Remove link ${i + 1}`} onClick={() => update("links", cv.links.filter((_, j) => j !== i))} /></div>
              </div>
            ))}
          </Section>
        </div>

        {/* Preview */}
        <div className={`lg:sticky lg:top-24 ${mobileTab === "preview" ? "" : "hidden lg:block"}`}>
          <CVPreview cv={cv} />
          <div className="cv-no-print mt-4 rounded-2xl border border-border bg-card p-4 flex gap-3">
            <Lightbulb size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Tips for Korean employers</p>
              <p>Put your visa and Korean level near the top. They&apos;re the first things recruiters check.</p>
              <p>Keep it to one page, and use numbers to show results (&quot;grew sales 30%&quot;).</p>
              <p>To save as PDF, click <strong>Download PDF</strong> and choose &quot;Save as PDF&quot;.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
