"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrderMobileNav } from "@/components/layout/order-mobile-nav";
import type { BusinessCategory } from "@/lib/category-config";
import { CATEGORY_CONFIGS } from "@/lib/category-config";

interface OrderNavbarProps {
  user: { name?: string | null; email?: string | null; role?: "admin" | "staff" };
  category: BusinessCategory;
  shopName?: string;
}

export function OrderNavbar({ user, category, shopName }: OrderNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const cfg = CATEGORY_CONFIGS[category as "studio" | "clothing"] || CATEGORY_CONFIGS.studio;

  const accentClass =
    category === "studio"
      ? "text-violet-700 dark:text-violet-400"
      : "text-rose-700 dark:text-rose-400";

  const borderClass =
    category === "studio"
      ? "border-violet-200/80 dark:border-slate-800"
      : "border-rose-200/80 dark:border-slate-800";

  return (
    <>
      <header className={`sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-4 md:px-8 border-b bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl shadow-xs transition-colors duration-200 ${borderClass}`}>
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <div className="flex items-center gap-2 md:hidden min-w-0">
            <span className={`font-serif font-bold text-xs sm:text-sm truncate ${accentClass}`}>
              {shopName || cfg.label}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${accentClass}`}>
              {user.role} · {cfg.label}
            </span>
          </div>
          <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl font-bold text-sm border ${
            category === "studio"
              ? "bg-violet-100 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30 text-violet-800 dark:text-violet-400"
              : "bg-rose-100 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-400"
          }`}>
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </header>

      <OrderMobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        category={category}
        shopName={shopName}
      />
    </>
  );
}
