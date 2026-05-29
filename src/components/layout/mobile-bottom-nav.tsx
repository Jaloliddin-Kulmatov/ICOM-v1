"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useNotifCount } from "@/hooks/use-notif-count";

// AI moved to a floating action button (ChatWidget) so it's reachable from
// every page. We swapped that bottom-nav slot for the Chat Q&A feed, which
// is one of the highest-engagement pages.
const tabs = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Home"      },
  { href: "/community",    icon: Users,           label: "Community" },
  { href: "/chat",         icon: MessageSquare,   label: "Chat"      },
  { href: "/jobs",         icon: Briefcase,       label: "Internships"},
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
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {/* Indigo dot for profile when there are unread notifs —
                      red was too alarmist and clashed with the rest of the
                      bottom nav's indigo theme. */}
                  {href === "/dashboard/settings" && notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-background" />
                  )}
                </div>

                <span className={cn(
                  "text-[10px] font-medium leading-none",
                  active ? "text-indigo-500 dark:text-indigo-400" : ""
                )}>
                  {label}
                </span>

                {/* Active indicator bar at top */}
                {active && (
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
