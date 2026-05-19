"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  CreditCard, ChevronDown, ExternalLink, AlertCircle,
  CheckCircle2, ArrowLeft, Clock, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Opening a Bank Account",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "What do I need to open a Korean bank account?",
        a: "You need: (1) ARC card (외국인등록증), (2) Passport, (3) Korean phone number, (4) Proof of address (dormitory contract or residence certificate). Some banks also ask for an enrollment certificate from your university. You cannot open a bank account with just a tourist visa."
      },
      {
        q: "Which bank is best for international students?",
        a: "Kakao Bank (카카오뱅크) is the most popular — 100% app-based, no branch visit needed, free international transfers, and the app is available in English. For in-person banking, Shinhan Bank and IBK (Industrial Bank of Korea) are foreigner-friendly. IBK specifically has an international student program with reduced fees."
      },
      {
        q: "Can I open an account before I have an ARC card?",
        a: "Most banks require an ARC. However, some Shinhan and Woori branches allow account opening with just a passport for a limited '90-day account.' Ask specifically for a 비대면계좌 (non-face-to-face account) or visit a branch near your university. Kakao Bank requires an ARC."
      },
      {
        q: "How long does it take to open an account?",
        a: "Kakao Bank: 15–20 minutes via app. In-person bank: 30–60 minutes. Bring all documents to avoid a second trip. Some branches near universities have English-speaking staff — JBNU students can try the Shinhan or IBK branch inside or near campus."
      },
    ]
  },
  {
    title: "Kakao Bank (Recommended)",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    items: [
      {
        q: "How do I open a Kakao Bank account?",
        a: "Step 1: Download 카카오뱅크 (Kakao Bank) app from the App Store or Google Play. Step 2: Select '외국인' (Foreigner). Step 3: Enter your ARC number and scan it. Step 4: Verify with your Korean phone number (SMS). Step 5: Set up your PIN. Step 6: Your account and debit card are ready — the physical card arrives by mail in 3–5 business days."
      },
      {
        q: "What are Kakao Bank's fees?",
        a: "No monthly maintenance fee. Free domestic transfers 24/7. International transfers: ₩5,000 per transfer (much cheaper than traditional banks). The exchange rate is close to market rate. You can use the card overseas at ATMs worldwide (Visa network)."
      },
      {
        q: "Does Kakao Bank have an English interface?",
        a: "The app is primarily in Korean, but the interface is very visual and intuitive. The main sections: 계좌 (Accounts), 이체 (Transfer), 카드 (Card), 더보기 (More). Many students use it without any Korean knowledge. Google Translate camera can help with any unclear menus."
      },
    ]
  },
  {
    title: "Shinhan Bank & IBK",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "What is the IBK International Student Program?",
        a: "IBK (기업은행) has a dedicated program for international students with: free debit card, free domestic transfers, discounted international wire fees, and no minimum balance requirement. Visit any IBK branch with your ARC, passport, and enrollment certificate. Ask for the '외국인 유학생 통장' (Foreign Student Account)."
      },
      {
        q: "Does Shinhan Bank have English support?",
        a: "Yes. Shinhan Bank has an English-language app called 'Shinhan SOL Bank' available on App Store and Google Play. It supports English, Chinese, Vietnamese, and more. Their customer service line 1599-8000 has multilingual support. Some university-area branches have English-speaking staff."
      },
      {
        q: "What is a Woori Bank WON account?",
        a: "Woori Bank's '비대면 계좌' (non-face-to-face account) can sometimes be opened online even for foreigners. The WON통장 account has no fees and works with their app. However, verification requires an ARC and a Korean phone number."
      },
    ]
  },
  {
    title: "Sending Money Home (Remittance)",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    items: [
      {
        q: "What is the cheapest way to send money home from Korea?",
        a: "Wise (formerly TransferWise) is the cheapest option for most currencies — low flat fee + mid-market exchange rate, no hidden charges. Alternatives: Kakao Bank international transfer (₩5,000 flat fee), Western Union (faster but higher fees), and Remitly (good for USD). Avoid bank telegraphic transfers — fees are ₩25,000–50,000 per transaction."
      },
      {
        q: "How do I use Wise to send money from Korea?",
        a: "Step 1: Sign up at wise.com with your email. Step 2: Verify your ID (ARC or passport scan). Step 3: Add your Korean bank account as the source. Step 4: Enter recipient bank details. Step 5: Initiate transfer — arrives in 1–3 business days. Wise shows the exact amount the recipient will receive before you confirm."
      },
      {
        q: "Are there limits on how much I can send abroad?",
        a: "For annual transfers under USD 50,000 (approx. ₩66 million), no special declaration is needed. Above that threshold, you must file a foreign exchange transaction report with the bank. Student stipends and tuition refunds are exempt with documentation."
      },
      {
        q: "Can I use PayPal in Korea?",
        a: "PayPal works in Korea but is not ideal — exchange rates are poor and fees are high. It's better for receiving payments from abroad. For sending money home, Wise, Kakao Bank international transfer, or Remitly are all better options."
      },
    ]
  },
  {
    title: "Naver Pay & Kakao Pay",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    items: [
      {
        q: "How do I set up Kakao Pay?",
        a: "Kakao Pay is built into KakaoTalk. Open KakaoTalk → tap the bottom-right '...' → select '페이' (Pay). Link your Kakao Bank account or any Korean bank card. You can then pay at convenience stores, restaurants, and online shops by scanning QR codes or using the app."
      },
      {
        q: "How do I set up Naver Pay?",
        a: "Download the Naver app or go to pay.naver.com. Sign up with your email or phone, then link a Korean bank account or debit card. Naver Pay is widely used for online shopping on Naver Shopping, Coupang, and delivery apps like Baemin (배달의민족)."
      },
      {
        q: "Can I pay with foreign cards in Korea?",
        a: "Visa and Mastercard foreign cards work at most stores, restaurants, and online shops. However, many Korean websites require a Korean card and phone number for online payment. For daily use, getting a Korean debit card (through Kakao Bank or another bank) makes life much easier."
      },
    ]
  },
];

const quickLinks = [
  { label: "Kakao Bank App", url: "https://www.kakaobank.com", note: "Open account via app (foreigners)" },
  { label: "Shinhan Bank (English)", url: "https://www.shinhan.com/hpe/index.jsp", note: "Shinhan SOL multilingual app" },
  { label: "IBK (Industrial Bank)", url: "https://www.ibk.co.kr/eng/index.ibk", note: "Student-friendly account" },
  { label: "Wise (Send Money Home)", url: "https://wise.com", note: "Cheapest international transfer" },
  { label: "Remitly", url: "https://www.remitly.com", note: "Good for USD, CNY, UZS transfers" },
  { label: "Kakao Pay", url: "https://www.kakaopay.com", note: "Mobile payments via KakaoTalk" },
];

const fees = [
  { label: "Kakao Bank domestic", fee: "Free" },
  { label: "Kakao Bank intl. transfer", fee: "₩5,000/transfer" },
  { label: "Wise transfer", fee: "~0.5% of amount" },
  { label: "Bank wire (domestic bank)", fee: "₩500–2,000" },
  { label: "Bank wire (international)", fee: "₩25,000–50,000" },
  { label: "ATM withdrawal (abroad)", fee: "₩2,000–3,000" },
];

export default function BankingPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-violet-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Back to Support
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <CreditCard size={18} className="text-violet-500" />
              </div>
              <div>
                <Badge variant="violet" className="text-[10px] mb-1">6 guides</Badge>
                <h1 className="text-2xl font-bold text-foreground">Banking & Finance</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Open accounts, send money home, set up Kakao Pay and Naver Pay — everything about managing money in Korea.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {sections.map(section => (
              <div key={section.title} className={`rounded-2xl border ${section.border} ${section.bg} overflow-hidden`}>
                <div className="px-5 py-3.5 border-b border-inherit">
                  <h2 className={`text-sm font-bold ${section.color}`}>{section.title}</h2>
                </div>
                <div className="divide-y divide-border/50">
                  {section.items.map(item => (
                    <div key={item.q} className="bg-card/60">
                      <button
                        className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-3 hover:bg-muted/30 transition-colors"
                        onClick={() => setOpen(open === item.q ? null : item.q)}
                      >
                        <span className="text-sm font-medium text-foreground">{item.q}</span>
                        <ChevronDown size={15} className={`text-muted-foreground shrink-0 transition-transform ${open === item.q ? "rotate-180" : ""}`} />
                      </button>
                      {open === item.q && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                <strong className="text-foreground">Note:</strong> Bank policies change regularly. Always check the official bank website or visit a branch for the latest requirements, especially after policy updates.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" /> Transfer Fees at a Glance
              </h3>
              <div className="space-y-2 text-xs">
                {fees.map(r => (
                  <div key={r.label} className="flex justify-between text-muted-foreground">
                    <span>{r.label}</span>
                    <span className="text-foreground font-medium">{r.fee}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">Official Links</h3>
              <div className="space-y-3">
                {quickLinks.map(l => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start justify-between gap-2 group">
                    <div>
                      <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 group-hover:underline">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground">{l.note}</p>
                    </div>
                    <ExternalLink size={11} className="text-muted-foreground/40 mt-0.5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
              <h3 className="text-xs font-semibold text-foreground mb-1">Pro tip: Get Kakao Bank first</h3>
              <p className="text-xs text-muted-foreground mb-3">It&apos;s the fastest to open (15 min on your phone), has no fees, and integrates with Kakao Pay for daily spending.</p>
              <Link href="/support/faq" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:bg-emerald-500/15 transition-colors">
                Go to FAQ <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
