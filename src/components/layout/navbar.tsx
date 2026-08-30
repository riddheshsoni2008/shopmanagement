"use client";

import { useState } from "react";
import { Gem, Menu, Sparkles, TrendingUp } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCurrency } from "@/lib/utils";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: "admin" | "staff";
  };
  rates?: {
    goldRate22k: number;
    goldRate18k: number;
    silverRate: number;
    shopName: string;
  } | null;
}

export function Navbar({ user, rates }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-amber-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 px-4 md:px-8 backdrop-blur-xl shadow-2xs transition-colors duration-200">
        {/* Left: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-800 dark:hover:text-slate-200 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/logo.png"
              alt="Zeal Jewellers Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="font-serif font-bold text-amber-800 dark:text-amber-400 text-sm">
              {rates?.shopName || "Zeal Jewellers"}
            </span>
          </div>
        </div>

        {/* Center: Live Rates Banner Ticker */}
        {rates && (
          <div className="hidden lg:flex items-center gap-4 rounded-full border border-amber-300 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/5 px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
            <span className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-400 shrink-0">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> Live Rates:
            </span>
            <div className="flex items-center gap-3 font-medium">
              <span>
                Gold 22K: <strong className="text-amber-900 dark:text-amber-300">{formatCurrency(rates.goldRate22k)}/g</strong>
                <span className="text-slate-400 dark:text-slate-500 mx-1">|</span>
                <strong className="text-amber-800 dark:text-amber-200">{formatCurrency(rates.goldRate22k * 10)}</strong>
                <span className="text-slate-500 text-[10px]">/10g</span>
              </span>
              <span className="text-amber-300 dark:text-slate-600">•</span>
              <span>
                Gold 18K: <strong className="text-amber-900 dark:text-amber-300">{formatCurrency(rates.goldRate18k)}/g</strong>
                <span className="text-slate-400 dark:text-slate-500 mx-1">|</span>
                <strong className="text-amber-800 dark:text-amber-200">{formatCurrency(rates.goldRate18k * 10)}</strong>
                <span className="text-slate-500 text-[10px]">/10g</span>
              </span>
              <span className="text-amber-300 dark:text-slate-600">•</span>
              <span>
                Silver: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(rates.silverRate)}/g</strong>
                <span className="text-slate-400 dark:text-slate-500 mx-1">|</span>
                <strong className="text-slate-700 dark:text-slate-100">{formatCurrency(rates.silverRate * 1000)}</strong>
                <span className="text-slate-500 text-[10px]">/kg</span>
              </span>
            </div>
          </div>
        )}

        {/* Right: Theme Toggle & User Status */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wide">
              {user.role} Account
            </span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        shopName={rates?.shopName}
      />
    </>
  );
}
