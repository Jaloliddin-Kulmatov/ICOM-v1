import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Korean universities",
  description: "A guide to Korean universities and their programs for international students.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
