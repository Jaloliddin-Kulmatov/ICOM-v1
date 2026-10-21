import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internships",
  description: "Internships in Korea open to international students, checked every day. Filter by field, city and Korean level.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
