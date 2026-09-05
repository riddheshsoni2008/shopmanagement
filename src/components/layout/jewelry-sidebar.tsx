"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Gem, ShoppingCart, Receipt,
  DollarSign, BarChart3, Settings, LogOut, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/actions/auth";
import { toast } from "sonner";

interface JewelrySidebarProps {
  user: { name?: string | null; email?: string | null; role?: "admin" | "staff" };
  shopName?: string;
}

const BASE = "/dashboard/jewelry";

const navItems = [
  { title: "Dashboard", href: `${BASE}/dashboard`, icon: LayoutDashboard },
  { title: "Inventory Stock", href: `${BASE}/stock`, icon: Gem },
  { title: "New Sale Bill", href: `${BASE}/sales/new`, icon: ShoppingCart },
  { title: "Sales History", href: `${BASE}/sales`, icon: Receipt },
  { title: "Expenses", href: `${BASE}/expenses`, icon: DollarSign },
  { title: "Reports & Analytics", href: `${BASE}/reports`, icon: BarChart3 },
  { title: "Shop Settings", href: `${BASE}/settings`, icon: Settings },
];

export function JewelrySidebar({ user, shopName }: JewelrySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user.role === "admin";

  const adminOnly = ["/expenses", "/reports", "/settings"];
  const visibleItems = navItems.filter(
    (item) => !adminOnly.some((p) => item.href.endsWith(p)) || isAdmin
  );

  const handleLogout = async () => {
    const res = await logoutUser();
    if (res.success) {
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-amber-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 backdrop-blur-xl sticky top-0 shadow-xs transition-colors duration-200">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-amber-100 dark:border-slate-800/80 overflow-hidden">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain shrink-0" />
        <div className="overflow-hidden min-w-0">
          <h1 className="font-serif font-bold text-sm text-amber-800 dark:text-amber-400 leading-tight truncate">
            {shopName || "Zeal Jewellers"}
          </h1>
          <span className="text-[9px] text-amber-600/80 dark:text-slate-400 uppercase tracking-widest font-semibold block">
            Jewelry · POS & Inventory
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Jewelry Management
        </div>
        {navItems.map((item) => {
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.endsWith("/stock") && pathname.includes("/jewelry/stock/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group",
                isActive
                  ? "bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-amber-50/80 dark:hover:bg-slate-900 hover:text-amber-900 dark:hover:text-slate-200"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110",
                isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-slate-300"
              )} />
              {item.title}
            </Link>
          );
        })}

        {/* Switch business */}
        <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Switch Business
        </div>
        <Link
          href="/select-category"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-200 transition-all group"
        >
          <RefreshCw className="h-5 w-5 text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300" />
          Change Category
        </Link>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-amber-100 dark:border-slate-800/80 bg-amber-50/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400 font-bold border border-amber-300 dark:border-slate-700">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
              <span className="inline-block rounded bg-amber-500/15 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
