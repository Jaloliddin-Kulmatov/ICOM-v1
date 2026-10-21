import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const CONTACT = "202522916@jbnu.ac.kr";

const sections = [
  {
    id: "data",
    title: "What data we collect",
    body: `When you sign up: your name, email address, password (stored only as a bcrypt hash), university, home country and visa type. If you choose to add them: your visa expiry date, Korean level (TOPIK), job field and city, and your arrival checklist progress. What you create on ICOM: questions and answers, club memberships, club chat and events, private messages, feedback, ambassador applications, AI chat history, and a CV file (PDF or Word) if you upload one.`,
  },
  {
    id: "app",
    title: "The phone app",
    body: `If you allow notifications, the app stores a push token for your phone so we can tell you about new messages, answers and visa reminders. Visa reminders can also be scheduled on the phone itself. If the app crashes, it sends us the error message, the app version, the phone system (iOS or Android) and the screen it happened on. Crash reports do not include your messages or profile.`,
  },
  {
    id: "use",
    title: "How we use it",
    body: `To run ICOM: showing internships that match your field, city, Korean level and visa, reminding you before your visa expires, sending internship alert emails if you turn them on, sending password reset emails, and keeping the community safe (automatic filtering of rule-breaking posts, reports and blocks). We do not sell your data and we do not show ads. We only count how many visits the site gets per day, with no tracking of who you are.`,
  },
  {
    id: "visibility",
    title: "Who can see what",
    body: `Your name, university and country are shown with your questions, answers and club activity, and signed-in students can also see your visa type on your profile. Your email, visa expiry date, Korean level, job field, city and CV are visible only to you. Private messages are visible to you and the person you are writing to. Questions posted to "my university only" are shown only to students of that university. ICOM admins may review content that someone has reported.`,
  },
  {
    id: "providers",
    title: "Services that process data for us",
    body: `Render runs our server, Supabase stores our database (in Singapore), and Vercel serves the website. Groq processes messages you send to the AI assistant to write its answers. Resend sends our emails. Expo, Apple and Google deliver push notifications to your phone. If you sign in with Google on the website, Google confirms your email to us. Some of these companies process data outside Korea, for example in Singapore or the United States.`,
  },
  {
    id: "storage",
    title: "Your device",
    body: `To keep you signed in, the website stores a sign-in token in your browser's local storage and the app stores it in your phone's secure keychain. We do not use advertising or third-party tracking cookies. Signing out removes the token.`,
  },
  {
    id: "security",
    title: "Security",
    body: `Passwords are hashed with bcrypt and never stored in plain text. All data is sent over HTTPS. Sign-in tokens expire automatically, and password reset links work once and only for one hour. If you think someone has used your account, reset your password and contact us.`,
  },
  {
    id: "rights",
    title: "Your rights and deleting your account",
    body: `You can see and change your profile at any time (Profile in the app, Settings on the website). You can delete your account yourself: in the app go to Profile → Delete account, on the website go to Settings → Delete account. This permanently removes your profile, CV, questions, answers, private messages, club chat messages, clubs you created, AI chat history and devices. Feedback you sent is kept without your name. To get a copy of your data, email ${CONTACT}.`,
  },
  {
    id: "retention",
    title: "How long we keep data",
    body: `We keep your data while your account exists and delete it when you delete your account. Closed internship listings are removed automatically. Crash reports are kept only in our server logs, which are deleted after a short time.`,
  },
  {
    id: "children",
    title: "Age",
    body: `ICOM is for university students. It is not meant for children under 14, and we do not knowingly collect their data.`,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: `If we change how we use your data, we will update this page and change the date at the top. For important changes we will also tell you in the app or by email.`,
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
            <p className="text-xs text-muted-foreground">Last updated: 21 October 2026 · ICOM</p>
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
              <a href={`mailto:${CONTACT}`} className="text-indigo-500 hover:underline">
                {CONTACT}
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
