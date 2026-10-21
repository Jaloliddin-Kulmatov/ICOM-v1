import type { Metadata } from "next";

// The reset token is in the URL: don't pass it to other sites, don't index the page.
export const metadata: Metadata = {
  title: "Choose a new password",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
