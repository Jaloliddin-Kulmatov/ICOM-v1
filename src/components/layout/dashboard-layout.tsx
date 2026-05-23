import React from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import MobileBottomNav from "./mobile-bottom-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
      {/* Content: no left padding on mobile, sidebar-width on md+ */}
      <main className="pt-16 pb-20 md:pb-0 md:pl-60 min-h-screen transition-all duration-300">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
