"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, PlusCircle, Users,
  Camera, Scissors, BarChart3, Settings, LogOut, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/actions/auth";
import { toast } from "sonner";
import type { BusinessCategory } from "@/lib/category-config";

interface OrderSidebarProps {
  user: { name?: string | null; email?: string | null; role?: "admin" | "staff" };
  category: BusinessCategory;
  shopName?: string;
}

const CategoryIcon = {
  studio: Camera,
  clothing: Scissors,
  jewelry: LayoutDashboard,
};

const accentMap = {
  studio: {
    brand: "text-violet-700 dark:text-violet-400",
    sub: "text-violet-600/80 dark:text-slate-400",
    active: "bg-violet-500/10 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-500/30",
    activeIcon: "text-violet-600 dark:text-violet-400",
    hover: "hover:bg-violet-50/80 dark:hover:bg-slate-900 hover:text-violet-900 dark:hover:text-slate-200",
    border: "border-violet-200/80 dark:border-slate-800",
    footer: "bg-violet-50/40 dark:bg-slate-900/40",
    badge: "bg-violet-500/15 dark:bg-violet-500/10 text-violet-800 dark:text-violet-400",
    label: "Camera Studio",
    headerBorder: "border-violet-100 dark:border-slate-800/80",
  },
  clothing: {
    brand: "text-rose-700 dark:text-rose-400",
    sub: "text-rose-600/80 dark:text-slate-400",
    active: "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30",
    activeIcon: "text-rose-600 dark:text-rose-400",
    hover: "hover:bg-rose-50/80 dark:hover:bg-slate-900 hover:text-rose-900 dark:hover:text-slate-200",
    border: "border-rose-200/80 dark:border-slate-800",
    footer: "bg-rose-50/40 dark:bg-slate-900/40",
    badge: "bg-rose-500/15 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400",
    label: "Clothing Shop",
    headerBorder: "border-rose-100 dark:border-slate-800/80",
  },
};

export function OrderSidebar({ user, category, shopName }: OrderSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const a = accentMap[category as "studio" | "clothing"] || accentMap.studio;
  const Icon = CategoryIcon[category as "studio" | "clothing"] || Camera;
  const base = `/dashboard/${category}`;

  const navItems = [
    { title: "Dashboard", href: `${base}/dashboard`, icon: LayoutDashboard },
    { title: "Orders", href: `${base}/orders`, icon: ClipboardList },
    { title: "New Order", href: `${base}/orders/new`, icon: PlusCircle },
    { title: "Clients", href: `${base}/clients`, icon: Users },
    ...(category === "studio"
      ? [{ title: "Equipment", href: `${base}/equipment`, icon: Camera }]
      : []),
    { title: "Reports", href: `${base}/reports`, icon: BarChart3 },
    { title: "Settings", href: `${base}/settings`, icon: Settings },
  ];

  const handleLogout = async () => {
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
    <aside className={cn("hidden md:flex h-screen w-64 flex-col border-r bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl sticky top-0 shadow-xs transition-colors duration-200", a.border)}>
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-3 px-4 border-b overflow-hidden", a.headerBorder)}>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", `bg-${category === "studio" ? "violet" : "rose"}-100 dark:bg-${category === "studio" ? "violet" : "rose"}-500/20`)}>
          <Icon className={cn("h-5 w-5", a.brand)} />
        </div>
        <div className="overflow-hidden min-w-0">
          <h1 className={cn("font-serif font-bold text-sm leading-tight truncate", a.brand)}>
            {shopName || a.label}
          </h1>
          <span className={cn("text-[9px] uppercase tracking-widest font-semibold block", a.sub)}>
            {a.label} · Orders
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {a.label}
        </div>
        {navItems.map((item) => {
          const NavIcon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.endsWith("/orders") &&
              !item.href.endsWith("/orders/new") &&
              pathname.startsWith(`${base}/orders/`) &&
              !pathname.endsWith("/new"));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group",
                isActive ? a.active : cn("text-slate-600 dark:text-slate-400", a.hover)
              )}>
              <NavIcon className={cn("h-5 w-5 transition-transform group-hover:scale-110",
                isActive ? a.activeIcon : "text-slate-400 dark:text-slate-500")} />
              {item.title}
            </Link>
          );
        })}

        {/* Switch business */}
        <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Switch Business
        </div>
        <Link href="/select-category"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-200 transition-all group">
          <RefreshCw className="h-5 w-5 text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300" />
          Change Category
        </Link>
      </div>

      {/* Footer */}
      <div className={cn("p-4 border-t", a.headerBorder, a.footer)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold border",
              category === "studio"
                ? "bg-violet-100 dark:bg-slate-800 text-violet-800 dark:text-violet-400 border-violet-300 dark:border-slate-700"
                : "bg-rose-100 dark:bg-slate-800 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-slate-700"
            )}>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
              <span className={cn("inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", a.badge)}>
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
