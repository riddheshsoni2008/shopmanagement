"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={
        theme === "light"
          ? "Switch to Dark Slate Theme"
          : "Switch to Gold & White Luxury Theme"
      }
      className={cn(
        "relative inline-flex items-center gap-2 rounded-xl p-2 text-xs font-semibold transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/30",
        theme === "light"
          ? "bg-amber-100/80 text-amber-900 border border-amber-300 hover:bg-amber-200"
          : "bg-slate-800 text-amber-400 border border-slate-700 hover:bg-slate-700",
        className
      )}
    >
      <div className="relative flex items-center justify-center h-4 w-4">
        {theme === "light" ? (
          <Moon className="h-4 w-4 text-amber-800 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>

      {showLabel && (
        <span className="truncate">
          {theme === "light" ? "Dark Mode" : "Gold & White"}
        </span>
      )}
    </button>
  );
}
