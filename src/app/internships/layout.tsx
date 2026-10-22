import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Internships", template: "%s | ICOM Korea" },   // keep the site suffix on job pages
  description: "Internships in Korea open to international students, checked every day. Filter by field, city and Korean level.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
