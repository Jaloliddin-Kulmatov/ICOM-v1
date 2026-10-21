import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell the ICOM team what to fix or build next.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
