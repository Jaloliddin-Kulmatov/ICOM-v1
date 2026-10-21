import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "ICOM admin panel.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
