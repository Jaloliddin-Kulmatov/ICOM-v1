import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Guide to life in Korea", template: "%s | ICOM Korea" },   // keep the site suffix on guide pages
  description: "Step-by-step guides for international students: visa, banking, health insurance, housing and transport.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
