"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { UNIVERSITIES } from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Props { onClose: () => void; }

export default function AmbassadorModal({ onClose }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    university: user?.university || "JBNU",
    department: "",
    year: "",
    country: user?.country || "",
    visa_type: user?.visa_type || "",
    motivation: "",
    social: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full bg-[#1a1a2e] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-indigo-400/60 transition-colors [color-scheme:dark]";
  const labelCls = "text-xs font-medium text-white/55 mb-1.5 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch(`${API}/ambassador/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setEmailSent(!!data.email_sent);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Star size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Apply as Ambassador</h2>
              <p className="text-[11px] text-white/45">Represent your university on ICOM</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Application Submitted! 🎉</h3>
            <p className="text-sm text-white/60 mb-1">Your application has been received by the ICOM team.</p>
            {emailSent ? (
              <p className="text-xs text-emerald-400 mb-6">
                ✅ A confirmation email has been sent to <strong>{form.email}</strong>
              </p>
            ) : (
              <p className="text-xs text-white/35 mb-6">
                We&apos;ll review it and get back to you within a few days.
              </p>
            )}
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>University *</label>
              <select required value={form.university} onChange={e => setForm(p => ({...p, university: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                {UNIVERSITIES.map(u => <option key={u.id} value={u.shortName} className="bg-[#1a1a2e] text-white">{u.shortName} — {u.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Department / Major</label>
                <input value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} placeholder="e.g. Computer Science" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Year of Study</label>
                <select value={form.year} onChange={e => setForm(p => ({...p, year: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                  <option value="" className="bg-[#1a1a2e]">Select</option>
                  {["1st year","2nd year","3rd year","4th year","Graduate","PhD"].map(y => <option key={y} value={y} className="bg-[#1a1a2e] text-white">{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Country</label>
                <input value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} placeholder="e.g. Uzbekistan" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Visa Type</label>
                <select value={form.visa_type} onChange={e => setForm(p => ({...p, visa_type: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                  <option value="" className="bg-[#1a1a2e]">Select</option>
                  {["D-2","D-4","F-2","F-4","E-2","Other"].map(v => <option key={v} value={v} className="bg-[#1a1a2e] text-white">{v}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>KakaoTalk ID / Instagram / Contact</label>
              <input value={form.social} onChange={e => setForm(p => ({...p, social: e.target.value}))} placeholder="e.g. KakaoTalk: your_id" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Why do you want to be an ICOM Ambassador? *</label>
              <textarea
                required
                value={form.motivation}
                onChange={e => setForm(p => ({...p, motivation: e.target.value}))}
                rows={4}
                placeholder="Tell us about yourself, your experience as an international student, and why you'd make a great ambassador..."
                className={inputCls}
              />
            </div>

            {error && <p className="text-xs text-red-400 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />}
              Submit Application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
