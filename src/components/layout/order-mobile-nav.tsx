"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, PlusCircle, Users,
  Camera, Scissors, BarChart3, Settings, LogOut, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/actions/auth";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import type { BusinessCategory } from "@/lib/category-config";

interface OrderMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name?: string | null; email?: string | null; role?: "admin" | "staff" };
  category: BusinessCategory;
  shopName?: string;
} 

export function OrderMobileNav({ isOpen, onClose, user, category, shopName }: OrderMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  if (!isOpen) return null;

  const base = `/dashboard/${category}`;
  const isStudio = category === "studio";

  const items = [
    { title: "Dashboard", href: `${base}/dashboard`, icon: LayoutDashboard },
    { title: "Orders", href: `${base}/orders`, icon: ClipboardList },
    { title: "New Order", href: `${base}/orders/new`, icon: PlusCircle },
    { title: "Clients", href: `${base}/clients`, icon: Users },
    ...(isStudio ? [{ title: "Equipment", href: `${base}/equipment`, icon: Camera }] : []),
    { title: "Reports", href: `${base}/reports`, icon: BarChart3 },
    { title: "Settings", href: `${base}/settings`, icon: Settings },
  ];

  const activeStyle = isStudio
    ? "bg-violet-500/10 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30"
    : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30";

  const handleLogout = async () => {
    onClose();
    const res = await logoutUser();
    if (res.success) {
      toast.success("Logged out");
      router.push("/login");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-4/5 max-w-xs flex-col bg-white dark:bg-slate-950 p-6 shadow-2xl border-r border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <span className={cn("font-serif font-bold text-sm", isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400")}>
            {shopName || (isStudio ? "Camera Studio" : "Clothing Shop")}
          </span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 py-5 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href.endsWith("/orders") && !item.href.endsWith("/orders/new") && pathname.startsWith(`${base}/orders/`) && !pathname.endsWith("/new"));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive ? activeStyle : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900")}>
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Theme:</span>
            <ThemeToggle showLabel />
          </div>
          <button onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
