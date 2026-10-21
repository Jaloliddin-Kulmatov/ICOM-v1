import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set up your profile",
  description: "Tell us your university and visa so ICOM can match internships and reminders to you.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
