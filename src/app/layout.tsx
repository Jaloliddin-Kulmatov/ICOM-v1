import type { Metadata, Viewport } from "next";
import { Gothic_A1 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import AppSidebar from "@/components/layout/app-sidebar";
import { SIDEBAR_BOOT_SCRIPT } from "@/lib/sidebar-config";
import FeedbackWidget from "@/components/feedback/feedback-widget";
import ChatWidget from "@/components/ai/chat-widget";
import VisitTracker from "@/components/analytics/visit-tracker";
import InstallPrompt from "@/components/pwa/install-prompt";
import { AuthProvider } from "@/lib/auth";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Self-hosted by Next (no request to Google at page load). The font is split
// into hundreds of small unicode-range files; preload is off so the browser
// fetches only the few a page actually uses instead of all of them.
const gothic = Gothic_A1({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-gothic",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbf8" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "ICOM — International Community of Students in Korea",
    template: "%s | ICOM Korea",
  },
  description:
    "ICOM is the #1 platform for international students in Korea. Find internships, join student clubs, get visa help, and connect with 28,000+ students across 47 Korean universities.",
  keywords: [
    "international students Korea", "ICOM Korea", "study in Korea",
    "Korea university community", "international student visa Korea",
    "JBNU international students", "Korea internship foreign students",
    "student clubs Korea", "D-2 visa Korea", "D-4 visa Korea",
    "foreign students Jeonju", "Korea student jobs", "ICOM JBNU",
    "international community Korea", "living in Korea as a student",
    "Korea university life foreigner",
  ],
  metadataBase: new URL("https://icom.ai.kr"),
  manifest: "/manifest.json",
  alternates: { canonical: "https://icom.ai.kr" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ICOM",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "ICOM — International Community of Students in Korea",
    description: "Community, internships, visa guides, and AI support for international students in Korea. Join 28,000+ students.",
    type: "website",
    url: "https://icom.ai.kr",
    siteName: "ICOM Korea",
    locale: "en_US",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "ICOM — International Community of Students in Korea" }],
  },
  twitter: {
    card: "summary",
    title: "ICOM — International Community of Students in Korea",
    description: "Community, internships, visa guides, and AI support for international students in Korea.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const tree = (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="icon-theme"
    >
      <AuthProvider>
        <VisitTracker />
        <AppSidebar />
        <div className="app-main">{children}</div>
        <MobileBottomNav />
        <InstallPrompt />
        <FeedbackWidget />
        {/* AI floating button — desktop only (hidden on mobile) */}
        <div className="hidden md:block">
          <ChatWidget />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ICOM — International Community of Students in Korea",
    "alternateName": "ICOM Korea",
    "url": "https://icom.ai.kr",
    "logo": "https://icom.ai.kr/icon-512.png",
    "description": "ICOM is the leading platform for international students in Korea — connecting students across 47 universities with clubs, internships, visa guides, and AI support.",
    "foundingDate": "2024",
    "areaServed": "Korea",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student"
    },
    "sameAs": [
      "https://t.me/icom_jbnu",
      "https://open.kakao.com/o/p1Ifvqxi"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "url": "https://icom.ai.kr/guide"
    }
  };

  return (
    <html lang="en" className={gothic.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_BOOT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
        ) : (
          tree
        )}
      </body>
    </html>
  );
}
