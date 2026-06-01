import React from "react";
import Link from "next/link";
import { Github, Linkedin, Mail, Send, Globe } from "lucide-react";

// Custom KakaoTalk icon (yellow bubble)
function KakaoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.6 5.1 4 6.6l-1 3.7 4.3-2.8c.9.2 1.8.3 2.7.3 5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
    </svg>
  );
}

// Custom Telegram icon (paper plane)
function TelegramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

const footerLinks = {
  Platform: [
    { label: "Clubs", href: "/community" },
    { label: "Jobs & Internships", href: "/jobs" },
    { label: "Chat / Q&A", href: "/chat" },
    { label: "Support Guides", href: "/support" },
    { label: "AI Assistant", href: "/dashboard/ai" },
  ],
  Company: [
    { label: "About ICOM", href: "/about" },
    { label: "Blog", href: "/about#blog" },
    { label: "Careers", href: "/about#careers" },
    { label: "Press Kit", href: "/about#press" },
    { label: "Contact", href: "/contact" },
    { label: "Send Feedback", href: "/feedback" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/privacy#cookies" },
    { label: "Security", href: "/privacy#security" },
  ],
  Resources: [
    { label: "Visa Guides", href: "/support/visa" },
    { label: "Housing", href: "/support/housing" },
    { label: "Banking", href: "/support/banking" },
    { label: "Korean Life", href: "/daily-life" },
    { label: "FAQ", href: "/support/faq" },
  ],
};

// ICOM community channels
const communityLinks = [
  {
    icon: KakaoIcon,
    href: "https://open.kakao.com/o/p1Ifvqxi",
    label: "KakaoTalk Community",
    color: "hover:text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400/30",
  },
  {
    icon: TelegramIcon,
    href: "https://t.me/icom_jbnu",
    label: "Telegram Channel",
    color: "hover:text-sky-400 hover:bg-sky-400/10 hover:border-sky-400/30",
  },
];

// Founder's social links
const socialLinks = [
  { icon: Send,     href: "https://t.me/jaloliddinkulmatov",                    label: "Telegram" },
  { icon: Github,   href: "https://github.com/Jaloliddin-Kulmatov",             label: "GitHub" },
  { icon: Linkedin, href: "https://www.linkedin.com/in/jaloliddin-kulmatov-69a81a406/", label: "LinkedIn" },
  { icon: Globe,    href: "https://portfolio-n5v3.vercel.app/",                 label: "Portfolio" },
  { icon: Mail,     href: "mailto:jaloliddinqulmatov12@gmail.com",              label: "Email" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pb-8">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/logo.svg"
                alt="ICOM logo"
                className="h-8 w-8 rounded-full select-none"
                draggable={false}
              />
              <span className="font-bold text-xl tracking-tight text-foreground">
                ICOM<span className="text-indigo-400">.</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-4">
              The Operating System for International Students in Korea. Connect, grow, and thrive.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Currently supporting students across 89 countries in 47+ Korean universities.
            </p>
            {/* ICOM community channels */}
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                Join our community
              </p>
              <div className="flex items-center gap-2">
                {communityLinks.map(({ icon: Icon, href, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`h-9 flex items-center gap-2 px-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground ${color} transition-all duration-200 text-xs font-medium`}
                  >
                    <Icon size={15} />
                    {label === "KakaoTalk Community" ? "KakaoTalk" : "Telegram"}
                  </a>
                ))}
              </div>
            </div>

            {/* Founder's links */}
            <div className="flex items-center gap-3 mt-4">
              {socialLinks.map(({ icon: Icon, href, label }) => {
                const isExternal = href.startsWith("http");
                return (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-3">
                {title}
              </p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/8">
          <p className="text-xs text-muted-foreground/60">
            © 2025 ICOM Technologies, Inc. All rights reserved. Built for international students, with love.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60">Expanding to</span>
            <div className="flex items-center gap-1.5">
              {["🇰🇷", "🇯🇵", "🇸🇬", "🇩🇪", "🌏"].map((flag, i) => (
                <span key={i} className="text-sm" title={["Korea", "Japan", "Singapore", "Europe", "Global"][i]}>
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
