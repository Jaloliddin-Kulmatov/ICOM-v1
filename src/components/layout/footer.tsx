import React from "react";
import Link from "next/link";
import { Twitter, Github, Instagram, Linkedin, Mail } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Community", href: "/community" },
    { label: "Jobs & Internships", href: "/jobs" },
    { label: "Universities", href: "/universities" },
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

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#050508]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                <span className="text-white font-black text-sm tracking-tight">IC</span>
              </div>
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
            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <Icon size={14} />
                </a>
              ))}
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
