import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const sections = [
  {
    title: "Acceptance",
    body: `By creating a ICOM account, you agree to these terms. ICOM is a platform for international students studying in Korea. You must be enrolled (or applying) at a Korean university to use the platform.`,
  },
  {
    title: "Your account",
    body: `You are responsible for keeping your login credentials secure. You must provide accurate information when registering. One account per person — duplicate accounts may be removed. You must be 16 years or older to create an account.`,
  },
  {
    title: "Content you post",
    body: `You own the content you create on ICOM. By posting, you grant us a licence to display it on the platform. You agree not to post spam, misinformation, harassment, or content that violates Korean law. We may remove content that violates these rules.`,
  },
  {
    title: "AI Assistant",
    body: `The ICOM AI provides general guidance for international students. It is not a substitute for official advice from your university's international office, a lawyer, or the Korean immigration authority (HiKorea). Always verify important visa and legal information from official sources.`,
  },
  {
    title: "Jobs & ambassador programme",
    body: `ICOM lists job opportunities and internships for informational purposes. We do not guarantee employment or endorse any employer. Ambassador applications are reviewed by our team and we reserve the right to approve or decline any application.`,
  },
  {
    title: "Termination",
    body: `You may delete your account at any time. We may suspend or terminate accounts that violate these terms. Upon termination, your public posts may remain visible unless you request deletion.`,
  },
  {
    title: "Limitation of liability",
    body: `ICOM is provided "as is." We are not liable for decisions you make based on content found on the platform, including AI responses. We make no guarantees about the accuracy of listings, guides, or community posts.`,
  },
  {
    title: "Changes to these terms",
    body: `We may update these terms. We will notify you by email or in-app notification for significant changes. Continued use after changes means you accept the updated terms.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">Terms of Service</h1>
            <p className="text-xs text-muted-foreground">Last updated: May 2025 · ICOM Technologies</p>
          </div>

          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-sm font-bold text-foreground mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 rounded-xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">
              Questions?{" "}
              <a href="mailto:202522916@jbnu.ac.kr" className="text-indigo-500 hover:underline">
                202522916@jbnu.ac.kr
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
