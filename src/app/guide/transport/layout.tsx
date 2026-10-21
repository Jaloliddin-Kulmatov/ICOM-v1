import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transport guide",
  description: "Buses, subway, KTX and T-money in Korea for international students.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
