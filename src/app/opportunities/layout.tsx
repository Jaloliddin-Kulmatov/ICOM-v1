import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Internships, part-time jobs, scholarships, contests and programs in Korea open to international students. Filter by deadline, visa and city.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
