import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions from international students in Korea.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
