import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubs & communities",
  description: "Join university clubs and national communities for international students in Korea.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
