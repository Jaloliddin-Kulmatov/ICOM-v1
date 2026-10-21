import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join ICOM, the community for international students in Korea.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
