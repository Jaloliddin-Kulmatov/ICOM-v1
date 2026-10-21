import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visa & immigration guide",
  description: "D-2, D-4, D-10 and E-7 visas, ARC, extensions and part-time work permits for students in Korea.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
