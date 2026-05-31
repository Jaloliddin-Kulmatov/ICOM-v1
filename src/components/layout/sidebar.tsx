"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Globe,
  Bell,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Trophy,
  GraduationCap,
  FileText,
  HelpCircle,
  TrendingUp,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useNotifCount } from "@/hooks/use-notif-count";

const sidebarSections = [
  {
    label: "Main",
    links: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/community", icon: Users, label: "Clubs" },
      { href: "/jobs", icon: Briefcase, label: "Jobs & Internships" },
      { href: "/universities", icon: GraduationCap, label: "Universities" },
    ],
  },
  {
    label: "Tools",
    links: [
      { href: "/dashboard/ai", icon: Sparkles, label: "AI Assistant", badge: "AI" },
      { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
      { href: "/dashboard/bookmarks", icon: Bookmark, label: "Saved" },
      { href: "/dashboard/achievements", icon: Trophy, label: "Achievements" },
    ],
  },
  {
    label: "Resources",
    links: [
      { href: "/support", icon: Globe, label: "Life in Korea" },
      { href: "/support/visa", icon: FileText, label: "Visa Guides" },
      { href: "/support/faq", icon: HelpCircle, label: "FAQ" },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
      { href: "/dashboard/analytics", icon: TrendingUp, label: "My Stats" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const notifCount = useNotifCount(user?.id);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 bottom-0 z-40 hidden md:flex flex-col bg-blue-50/80 dark:bg-[#0a0a12] border-r border-blue-100 dark:border-white/8 transition-all duration-300 scrollbar-thin overflow-y-auto",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 dark:border-white/15 bg-blue-50 dark:bg-[#0a0a12] text-muted-foreground hover:text-foreground transition-colors shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className="flex flex-col gap-6 py-4 px-3 flex-1">
        {sidebarSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.links.map(({ href, icon: Icon, label, badge }) => {
                const isNotif = href === "/dashboard/notifications";
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                      isActive(href)
                        ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-r before:bg-indigo-500 dark:before:bg-indigo-400"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground hover:bg-blue-100 dark:hover:bg-white/5"
                    )}
                  >
                    <span className="relative shrink-0">
                      <Icon
                        size={17}
                        className={cn(
                          "transition-transform group-hover:scale-110",
                          isActive(href) ? "text-indigo-600 dark:text-indigo-400" : ""
                        )}
                      />
                      {isNotif && notifCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none">
                          {notifCount > 9 ? "9+" : notifCount}
                        </span>
                      )}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{label}</span>
                        {badge && (
                          <Badge
                            variant={badge === "AI" ? "violet" : "default"}
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {badge}
                          </Badge>
                        )}
                        {isNotif && notifCount > 0 && (
                          <span className="min-w-[18px] h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
                            {notifCount > 9 ? "9+" : notifCount}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Admin link — only for admins */}
        {user?.role === "admin" && (
          <div>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Admin
              </p>
            )}
            <Link
              href="/admin"
              title={collapsed ? "Admin Panel" : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive("/admin")
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/5"
              )}
            >
              <ShieldCheck size={17} className="shrink-0" />
              {!collapsed && <span className="flex-1">Admin Panel</span>}
            </Link>
          </div>
        )}
      </div>

      {/* User card + logout */}
      <div className="p-3 border-t border-blue-100 dark:border-white/8 shrink-0">
        {!collapsed ? (
          <>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-100 dark:hover:bg-white/5 transition-colors"
            >
              <Avatar size="sm" online>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || "Guest"}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.university || "JBNU"}{user?.visa_type ? ` · ${user.visa_type}` : ""}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="mt-1 w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all"
            >
              <LogOut size={15} className="shrink-0" />
              <span>Log out</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleLogout}
            title="Log out"
            className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
