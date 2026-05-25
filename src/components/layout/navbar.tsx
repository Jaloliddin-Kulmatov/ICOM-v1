"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, Menu, X, Search, Sparkles,
  Users, Briefcase, BookOpen, Globe,
  LayoutDashboard, LogIn, Home, LogOut, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import SearchModal from "@/components/ui/search-modal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useNotifCount } from "@/hooks/use-notif-count";

const navLinks = [
  { href: "/community", label: "Community", icon: Users },
  { href: "/jobs", label: "Internships", icon: Briefcase },
  { href: "/universities", label: "Universities", icon: BookOpen },
  { href: "/daily-life", label: "Daily Life", icon: Home },
  { href: "/support", label: "Support", icon: Globe },
];

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const notifCount = useNotifCount(user?.id);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  // ⌘K / Ctrl+K shortcut
  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  const active = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled || !transparent
            ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} prefetch className="flex items-center gap-2 group shrink-0">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm group-hover:shadow-[0_0_16px_rgba(99,102,241,0.5)] transition-shadow">
              <span className="text-white font-black text-sm leading-none select-none">IC</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight text-foreground">
                ICOM<span className="text-indigo-500">.</span>
              </span>
              <span className="text-[9px] text-muted-foreground font-medium tracking-wide hidden sm:block">
                International Community in Korea
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active(href)
                    ? "text-indigo-500 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon size={14} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {/* Search — always visible */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground text-xs hover:border-indigo-500/30 hover:text-foreground transition-colors"
            >
              <Search size={13} />
              <span>Search</span>
              <kbd className="hidden xl:inline-flex h-4 px-1 rounded bg-border text-[10px] font-mono">⌘K</kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Search size={16} />
            </button>

            {user ? (
              <>
                <Button variant="ghost" size="icon-sm" asChild title="AI Assistant">
                  <Link href="/dashboard/ai">
                    <Sparkles size={15} className="text-violet-500" />
                  </Link>
                </Button>

                <Button variant="ghost" size="icon-sm" className="relative" title="Notifications" asChild>
                  <Link href="/dashboard/notifications">
                    <Bell size={15} />
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none pointer-events-none">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 ml-1 px-2 py-1 rounded-xl hover:bg-accent transition-colors"
                >
                  <Avatar size="sm" online>
                    <AvatarFallback className="text-xs font-semibold">
                      {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{user.university || "ICOM"}</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                {/* Sign in: only useful for returning users — force=1 bypasses the
                    "new visitors go to /register" redirect on the login page. */}
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/login?force=1">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="gap-1.5">
                  <Link href="/register">
                    <LogIn size={13} />
                    Get started
                  </Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden bg-background/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-16 inset-x-0 z-40 md:hidden bg-background border-b border-border p-4 space-y-1 shadow-lg animate-slide-up">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  active(href)
                    ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border space-y-1">
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                    <LayoutDashboard size={17} />
                    Dashboard
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
                    >
                      <ShieldCheck size={17} />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileOpen(false); router.push("/"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <Button className="w-full gap-2" asChild>
                    <Link href="/register">
                      <LogIn size={14} />
                      Create free account
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login?force=1">
                      Sign in
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
