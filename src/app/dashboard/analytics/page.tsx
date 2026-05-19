"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";
import { TrendingUp, User, Calendar, Globe } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();

  const joined = (user as unknown as { created_at?: string })?.created_at
    ? new Date((user as unknown as { created_at: string }).created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
            <TrendingUp size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Stats</h1>
            <p className="text-xs text-muted-foreground">Your ICOM profile overview</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { icon: User, label: "Member Since", value: joined, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { icon: Globe, label: "University", value: user?.university || "Not set", color: "text-violet-400", bg: "bg-violet-500/10" },
            { icon: Calendar, label: "Visa Type", value: user?.visa_type || "Not set", color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { icon: TrendingUp, label: "Status", value: user?.role === "admin" ? "Admin" : "Student", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="p-5 rounded-2xl border border-white/8 bg-white/3">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${bg} mb-3`}>
                <Icon size={15} className={color} />
              </div>
              <div className="text-sm font-semibold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-2xl border border-white/8 bg-white/3 text-center">
          <p className="text-xs text-muted-foreground">Detailed activity stats coming soon.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
