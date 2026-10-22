import { redirect } from "next/navigation";

// Not built yet; send people to the dashboard instead of a "coming soon" page.
export default function Page() {
  redirect("/dashboard");
}
