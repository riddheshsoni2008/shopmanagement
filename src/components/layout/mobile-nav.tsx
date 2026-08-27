"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gem,
  ShoppingCart,
  Receipt,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string | null;
    email?: string | null;
    role?: "admin" | "staff";
  };
}

export function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!isOpen) return null;

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "staff"] },
    { title: "Inventory Stock", href: "/stock", icon: Gem, roles: ["admin", "staff"] },
    { title: "New Sale Bill", href: "/sales/new", icon: ShoppingCart, roles: ["admin", "staff"] },
    { title: "Sales History", href: "/sales", icon: Receipt, roles: ["admin", "staff"] },
    { title: "Expenses", href: "/expenses", icon: DollarSign, roles: ["admin"] },
    { title: "Reports & Analytics", href: "/reports", icon: BarChart3, roles: ["admin"] },
    { title: "Shop Settings", href: "/settings", icon: Settings, roles: ["admin"] },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user.role || "staff")
  );

  const handleLogout = async () => {
    onClose();
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
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex w-4/5 max-w-xs flex-col bg-slate-950 p-6 shadow-2xl border-r border-slate-800">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
              <Gem className="h-5 w-5" />
            </div>
            <span className="font-serif font-bold text-amber-400">Aura Jewelers</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 py-6 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/stock" && pathname.startsWith("/stock/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
