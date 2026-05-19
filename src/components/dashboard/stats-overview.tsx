import React from "react";
import {
  Briefcase,
  Users,
  Bell,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  {
    label: "Jobs Saved",
    value: "12",
    change: "+3",
    up: true,
    icon: Briefcase,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    href: "/dashboard/bookmarks",
  },
  {
    label: "Connections",
    value: "84",
    change: "+11",
    up: true,
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    href: "/community",
  },
  {
    label: "Notifications",
    value: "7",
    change: "unread",
    up: null,
    icon: Bell,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    href: "/dashboard/notifications",
  },
  {
    label: "Profile Views",
    value: "238",
    change: "-4%",
    up: false,
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    href: "/dashboard/analytics",
  },
];

export default function StatsOverview() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <a
            key={stat.label}
            href={stat.href}
            className="group p-5 rounded-2xl border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <Icon size={17} className={stat.color} />
              </div>
              {stat.up !== null && (
                <div
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    stat.up ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {stat.up ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {stat.change}
                </div>
              )}
              {stat.up === null && (
                <span className="text-xs text-muted-foreground">{stat.change}</span>
              )}
            </div>
            <div className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </a>
        );
      })}
    </div>
  );
}
