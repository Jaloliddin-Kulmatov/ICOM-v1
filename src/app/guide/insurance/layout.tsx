import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health insurance guide",
  description: "National Health Insurance (NHIS) for international students in Korea: who pays, how much and how to use it.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
