import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | ICOM Korea" } };

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
