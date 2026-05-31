import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import FeedbackWidget from "@/components/feedback/feedback-widget";
import ChatWidget from "@/components/ai/chat-widget";
import SplashScreen from "@/components/ui/splash-screen";
import { AuthProvider } from "@/lib/auth";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  title: "ICOM — The Operating System for International Students in Korea",
  description:
    "ICOM connects 28,000+ international students across 47 Korean universities. Community, jobs, visa guidance, and AI-powered support in one platform.",
  keywords: ["international students", "Korea", "university", "ICOM", "jobs", "visa", "community"],
  metadataBase: new URL("https://icom.ai.kr"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ICOM",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "ICOM — The OS for International Students in Korea",
    description: "Community, jobs, visa guidance, and AI support for international students in Korea.",
    type: "website",
    url: "https://icom.ai.kr",
    images: [{ url: "/favicon.svg" }],
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
        <SplashScreen />
        {children}
        <MobileBottomNav />
        <FeedbackWidget />
        {/* AI floating button — desktop only (hidden on mobile) */}
        <div className="hidden md:block">
          <ChatWidget />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
        ) : (
          tree
        )}
      </body>
    </html>
  );
}
