import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Housing guide",
  description: "Dorms, goshiwon and one-room flats in Korea: deposits, contracts and what to check.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
