import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask the community",
  description: "Ask questions about visas, jobs and life in Korea and get answers from other international students.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
