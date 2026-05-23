"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useNotifCount } from "@/hooks/use-notif-count";

const tabs = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Home"      },
  { href: "/community",    icon: Users,           label: "Community" },
  { href: "/jobs",         icon: Briefcase,       label: "Internships"},
  { href: "/dashboard/ai", icon: Sparkles,        label: "AI"        },
  { href: "/dashboard/settings", icon: User,      label: "Profile"   },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const notifCount = useNotifCount(user?.id);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      {/* Frosted glass bar */}
      <div className="bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="flex items-stretch">
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            const isAI = href === "/dashboard/ai";
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors",
                  active
                    ? "text-indigo-500 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* AI tab gets a special pill background */}
                {isAI ? (
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                    active
                      ? "bg-indigo-500 shadow-[0_4px_14px_rgba(99,102,241,0.5)]"
                      : "bg-muted"
                  )}>
                    <Icon
                      size={18}
                      className={active ? "text-white" : "text-muted-foreground"}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                    {/* Notification dot for profile */}
                    {href === "/dashboard/settings" && notifCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>
                )}

                {/* Active dot under non-AI tabs */}
                {!isAI && (
                  <span className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "text-indigo-500 dark:text-indigo-400" : ""
                  )}>
                    {label}
                  </span>
                )}

                {/* Active indicator bar at top */}
                {active && !isAI && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>
        {/* Safe area padding for iOS home indicator */}
        <div className="h-safe-area-inset-bottom bg-transparent" style={{ height: "env(safe-area-inset-bottom)" }} />
      </div>
    </nav>
  );
}
