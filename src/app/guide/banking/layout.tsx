import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Banking guide",
  description: "How to open a bank account in Korea as an international student, send money home and use banking apps.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
