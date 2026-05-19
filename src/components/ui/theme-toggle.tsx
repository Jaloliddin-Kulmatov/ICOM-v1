"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("h-8 w-8 rounded-lg bg-white/5 border border-white/10", className)} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn(
        "relative h-8 w-8 rounded-lg border flex items-center justify-center transition-all duration-200",
        "hover:scale-105 active:scale-95",
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-amber-400"
          : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-indigo-600",
        className
      )}
    >
      {isDark ? (
        <Sun size={15} className="transition-transform duration-300 rotate-0" />
      ) : (
        <Moon size={15} className="transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}
