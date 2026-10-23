import type { Metadata } from "next";

export const metadata: Metadata = { title: "Study tools" };

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
