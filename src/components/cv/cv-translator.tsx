"use client";

import React, { useState } from "react";
import { Check, Copy, Download, Languages, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, downloadFile } from "@/lib/api";

type Item = Record<string, string>;
export type CV = {
  full_name: string; headline: string; nationality: string; visa: string; email: string; phone: string; location: string;
  summary: string; education: Item[]; experience: Item[]; skills: string[]; languages: Item[]; certifications: Item[]; links: Item[];
};
type Target = "ko" | "en";

const L = {
  ko: { education: "학력", experience: "경력", summary: "자기소개", languages: "어학", certifications: "자격증", skills: "기술", links: "링크" },
  en: { education: "Education", experience: "Experience", summary: "Summary", languages: "Languages", certifications: "Certifications", skills: "Skills", links: "Links" },
};

const period = (it: Item) => (it.start || it.end ? `${it.start || ""} ~ ${it.end || ""}` : "");

/** Plain text of the translated CV, for copying into an email or a company's form. */
function asText(cv: CV, t: Target): string {
  const l = L[t];
  const out: string[] = [cv.full_name, cv.headline, [cv.nationality, cv.visa, cv.phone, cv.email, cv.location].filter(Boolean).join(" · "), ""];
  if (cv.summary) out.push(`[${l.summary}]`, cv.summary, "");
  for (const key of ["education", "experience"] as const) {
    if (!cv[key].length) continue;
    out.push(`[${l[key]}]`);
    for (const it of cv[key]) {
      const head = key === "education" ? [it.school, it.degree, it.field] : [it.company, it.title, it.location];
      out.push(`${period(it)}  ${head.filter(Boolean).join(" · ")}`.trim());
      if (it.details) out.push(it.details);
    }
    out.push("");
  }
  if (cv.languages.length) out.push(`[${l.languages}]`, cv.languages.map((x) => `${x.name} ${x.level}`.trim()).join(", "), "");
  if (cv.certifications.length) out.push(`[${l.certifications}]`, cv.certifications.map((x) => `${x.name} ${x.year}`.trim()).join(", "), "");
  if (cv.skills.length) out.push(`[${l.skills}]`, cv.skills.join(", "), "");
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Turn the uploaded CV (or pasted text) into a Korean 이력서 or an English CV, then download it as Word. */
export default function CVTranslator({ hasFile }: { hasFile: boolean }) {
  const [target, setTarget] = useState<Target>("ko");
  const [source, setSource] = useState<"file" | "text">(hasFile ? "file" : "text");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ cv: CV; target: Target } | null>(null);
  const [copied, setCopied] = useState(false);
  const from = hasFile ? source : "text";

  const translate = async () => {
    setBusy(true); setError(""); setResult(null);
    const { data, error: e } = await api.post<{ cv: CV; target: Target }>("/cv/me/translate", { target, source: from, text });
    setBusy(false);
    if (data) setResult(data); else setError(e || "Couldn't translate your CV. Please try again.");
  };

  const download = async () => {
    if (!result) return;
    const name = `${(result.cv.full_name || "ICOM").replace(/\s+/g, "_")}_${result.target === "ko" ? "이력서" : "CV"}.docx`;
    const e = await downloadFile("/cv/me/export", name, { cv: result.cv, lang: result.target });
    if (e) setError(e);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard?.writeText(asText(result.cv, result.target)).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const pill = (on: boolean) => `px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    on ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground"}`;
  const cv = result?.cv;
  const l = L[result?.target || target];

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <span className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 flex items-center justify-center"><Languages size={15} /></span>
        Korean CV maker
      </h2>
      <p className="text-xs text-muted-foreground mt-1">
        Turn your CV into a Korean 이력서 (or a clean English CV) in the format Korean companies expect, then download it as a Word file.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Language" className="inline-flex p-1 rounded-xl border border-border">
          <button role="radio" aria-checked={target === "ko"} className={pill(target === "ko")} onClick={() => setTarget("ko")}>한국어 이력서</button>
          <button role="radio" aria-checked={target === "en"} className={pill(target === "en")} onClick={() => setTarget("en")}>English CV</button>
        </div>
        {hasFile && (
          <div role="radiogroup" aria-label="From" className="inline-flex p-1 rounded-xl border border-border">
            <button role="radio" aria-checked={source === "file"} className={pill(source === "file")} onClick={() => setSource("file")}>From my uploaded CV</button>
            <button role="radio" aria-checked={source === "text"} className={pill(source === "text")} onClick={() => setSource("text")}>Paste text</button>
          </div>
        )}
      </div>

      {from === "text" && (
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} maxLength={12000}
          aria-label="Your CV text" placeholder="Paste your CV here: education, work, skills, languages…"
          className="mt-3 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring" />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={translate} disabled={busy || (from === "text" && text.trim().length < 40)} className="gap-1.5">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {busy ? "Translating… (about 20 seconds)" : target === "ko" ? "Make my Korean CV" : "Make my English CV"}
        </Button>
        <p className="text-[11px] text-muted-foreground">AI only rewrites what is in your CV. It never adds jobs or skills.</p>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}

      {cv && (
        <div className="mt-5 rounded-xl border border-border bg-background p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-foreground">{cv.full_name || "—"}</p>
              {cv.headline && <p className="text-sm text-muted-foreground">{cv.headline}</p>}
              <p className="text-xs text-muted-foreground mt-1">{[cv.nationality, cv.visa, cv.phone, cv.email, cv.location].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}</Button>
              <Button size="sm" className="gap-1" onClick={download}><Download size={14} /> Download Word</Button>
            </div>
          </div>
          {cv.summary && <Block title={l.summary}><p className="text-sm whitespace-pre-line">{cv.summary}</p></Block>}
          {(["education", "experience"] as const).map((key) => cv[key].length > 0 && (
            <Block key={key} title={l[key]}>
              {cv[key].map((it, i) => (
                <div key={i} className="grid grid-cols-[7.5rem_1fr] gap-3 text-sm py-1.5 border-t border-border first:border-0">
                  <span className="text-xs text-muted-foreground tabular-nums">{period(it)}</span>
                  <div>
                    <p className="font-semibold">{(key === "education" ? [it.school, it.degree, it.field] : [it.company, it.title, it.location]).filter(Boolean).join(" · ")}</p>
                    {it.details && <p className="text-muted-foreground whitespace-pre-line text-[13px]">{it.details}</p>}
                  </div>
                </div>
              ))}
            </Block>
          ))}
          {cv.languages.length > 0 && <Block title={l.languages}><p className="text-sm">{cv.languages.map((x) => `${x.name} ${x.level}`.trim()).join(", ")}</p></Block>}
          {cv.certifications.length > 0 && <Block title={l.certifications}><p className="text-sm">{cv.certifications.map((x) => `${x.name} ${x.year}`.trim()).join(", ")}</p></Block>}
          {cv.skills.length > 0 && <Block title={l.skills}><p className="text-sm">{cv.skills.join(", ")}</p></Block>}
          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            Check names, dates and titles before you send it. AI translation can make mistakes.
          </p>
        </div>
      )}
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1.5">{title}</p>
      {children}
    </div>
  );
}
