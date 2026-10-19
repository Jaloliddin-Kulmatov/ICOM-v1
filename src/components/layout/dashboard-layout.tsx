import React from "react";
import Navbar from "./navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* The sidebar and MobileBottomNav are rendered globally in layout.tsx;
          the page padding for the sidebar comes from .app-main in globals.css. */}
      <main className="pt-16 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
