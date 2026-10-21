import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Living in Korea guide",
  description: "Phone plans, shopping, food and everyday life in Korea for international students.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
