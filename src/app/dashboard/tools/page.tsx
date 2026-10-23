import React from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StudyToolsGrid from "@/components/tools/study-tools-grid";

export default function StudyToolsPage() {
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Study tools</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Timetable, GPA, deadlines, attendance and a focus timer, made for Korean universities.</p>
      <StudyToolsGrid />
    </DashboardLayout>
  );
}
