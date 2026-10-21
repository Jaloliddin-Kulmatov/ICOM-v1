import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Korean language guide",
  description: "Learning Korean and TOPIK for international students in Korea.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
