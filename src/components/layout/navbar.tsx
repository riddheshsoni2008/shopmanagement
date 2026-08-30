"use client";

import { useState } from "react";
import { Gem, Menu, Sparkles, TrendingUp } from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-amber-200/80 bg-white/90 px-4 md:px-8 backdrop-blur-xl shadow-2xs">
        {/* Left: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-800 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/logo.png"
              alt="Zeal Jewellers Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="font-serif font-bold text-amber-800 text-sm">
              {rates?.shopName || "Zeal Jewellers"}
            </span>
          </div>
        </div>

        {/* Center: Live Rates Banner Ticker */}
        {rates && (
          <div className="hidden lg:flex items-center gap-4 rounded-full border border-amber-300 bg-amber-50/80 px-4 py-1.5 text-xs text-slate-700 shadow-xs">
            <span className="flex items-center gap-1 font-semibold text-amber-800 shrink-0">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600" /> Live Rates:
            </span>
            <div className="flex items-center gap-3 font-medium">
              <span>
                Gold 22K: <strong className="text-amber-900">{formatCurrency(rates.goldRate22k)}/g</strong>
                <span className="text-slate-400 mx-1">|</span>
                <strong className="text-amber-800">{formatCurrency(rates.goldRate22k * 10)}</strong>
                <span className="text-slate-500 text-[10px]">/10g</span>
              </span>
              <span className="text-amber-300">•</span>
              <span>
                Gold 18K: <strong className="text-amber-900">{formatCurrency(rates.goldRate18k)}/g</strong>
                <span className="text-slate-400 mx-1">|</span>
                <strong className="text-amber-800">{formatCurrency(rates.goldRate18k * 10)}</strong>
                <span className="text-slate-500 text-[10px]">/10g</span>
              </span>
              <span className="text-amber-300">•</span>
              <span>
                Silver: <strong className="text-slate-800">{formatCurrency(rates.silverRate)}/g</strong>
                <span className="text-slate-400 mx-1">|</span>
                <strong className="text-slate-700">{formatCurrency(rates.silverRate * 1000)}</strong>
                <span className="text-slate-500 text-[10px]">/kg</span>
              </span>
            </div>
          </div>
        )}

        {/* Right: User Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-800">{user.name}</span>
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wide">
              {user.role} Account
            </span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 border border-amber-300 text-amber-800 font-bold">
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
