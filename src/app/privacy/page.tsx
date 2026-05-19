import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const sections = [
  {
    id: "data",
    title: "What data we collect",
    body: `We collect only what's necessary to run ICOM: your name, email address, university, country, and visa type when you register. We also store the content you create — posts, club memberships, job applications, and AI chat history — to provide the service.`,
  },
  {
    id: "use",
    title: "How we use it",
    body: `Your data is used to personalise your experience (showing relevant jobs, communities, and restaurant recommendations), to operate the platform, and to send you important service updates. We do not sell your data to third parties.`,
  },
  {
    id: "ai",
    title: "AI conversations",
    body: `AI chat messages are sent to Groq (our AI provider) to generate responses. We store your recent chat history on our servers to enable conversation context. You can clear your history at any time from your dashboard settings.`,
  },
  {
    id: "cookies",
    title: "Cookies",
    body: `We use a single authentication token stored in your browser's localStorage to keep you logged in. We do not use third-party tracking cookies or advertising cookies. Your session token is cleared when you log out.`,
  },
  {
    id: "security",
    title: "Security",
    body: `Passwords are hashed using bcrypt and never stored in plain text. All data is transmitted over HTTPS. Your JWT session token expires automatically. If you suspect unauthorised access, change your password immediately and contact us.`,
  },
  {
    id: "rights",
    title: "Your rights",
    body: `You can request a copy of your data, update your profile at any time in Settings, or delete your account by contacting us at privacy@konect.kr. We will process deletion requests within 7 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: May 2025 · ICOM Technologies</p>
          </div>

          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.id} id={s.id}>
                <h2 className="text-sm font-bold text-foreground mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 rounded-xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">
              Questions about this policy?{" "}
              <a href="mailto:privacy@konect.kr" className="text-indigo-500 hover:underline">
                privacy@konect.kr
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
