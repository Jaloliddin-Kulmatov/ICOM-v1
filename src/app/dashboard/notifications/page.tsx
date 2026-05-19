import DashboardLayout from "@/components/layout/dashboard-layout";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Bell size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">Stay up to date with ICOM activity</p>
          </div>
        </div>
        <div className="p-12 rounded-2xl border border-white/8 bg-white/3 text-center">
          <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">You&apos;ll see updates about jobs, clubs, and community here.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
