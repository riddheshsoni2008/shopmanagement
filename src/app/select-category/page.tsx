"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setBusinessCategory } from "@/actions/category";
import { toast } from "sonner";
import { Gem, Camera, Scissors, ArrowRight, Loader2, LogOut } from "lucide-react";
import { logoutUser } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const CATEGORIES = [
  {
    id: "jewelry" as const,
    label: "Jewelry Shop",
    description: "Stock-based inventory management. Track gold, silver and platinum pieces, create sale bills, manage expenses and run P&L reports.",
    icon: Gem,
    color: "amber",
    features: ["Inventory Stock", "Sale Billing", "Expense Tracking", "Gold / Silver Rates"],
  },
  {
    id: "studio" as const,
    label: "Camera Studio",
    description: "Order and job-based management for photography and videography services. Track shoots, client orders, per-job costs and equipment.",
    icon: Camera,
    color: "violet",
    features: ["Client Orders", "Per-Job Expenses", "Equipment Tracker", "Revenue Reports"],
  },
  {
    id: "clothing" as const,
    label: "Clothing Shop",
    description: "Tailoring and stitching order management. Handle custom orders, track fabric costs, alteration jobs and client measurements.",
    icon: Scissors,
    color: "rose",
    features: ["Stitching Orders", "Fabric Cost Tracking", "Measurement Notes", "Revenue Reports"],
  },
] as const;

const colorMap: Record<string, Record<string, string>> = {
  amber: {
    ring: "ring-amber-400 dark:ring-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconText: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300",
    button: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
    border: "border-amber-300 dark:border-amber-500/40",
    selectedBorder: "border-amber-500 dark:border-amber-400",
  },
  violet: {
    ring: "ring-violet-400 dark:ring-violet-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    iconBg: "bg-violet-100 dark:bg-violet-500/20",
    iconText: "text-violet-700 dark:text-violet-400",
    badge: "bg-violet-100 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300",
    button: "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700",
    border: "border-violet-300 dark:border-violet-500/40",
    selectedBorder: "border-violet-500 dark:border-violet-400",
  },
  rose: {
    ring: "ring-rose-400 dark:ring-rose-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
    iconText: "text-rose-700 dark:text-rose-400",
    badge: "bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300",
    button: "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700",
    border: "border-rose-300 dark:border-rose-500/40",
    selectedBorder: "border-rose-500 dark:border-rose-400",
  },
};

export default function SelectCategoryPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<"jewelry" | "studio" | "clothing" | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSelect = async (id: "jewelry" | "studio" | "clothing") => {
    if (isPending) return;
    setSelected(id);
    setIsPending(true);
    try {
      const res = await setBusinessCategory(id);
      if (res.success) {
        toast.success(`${CATEGORIES.find((c) => c.id === id)?.label} selected!`);
        // Force a full navigation so the JWT is refreshed on the next request
        window.location.href = `/dashboard/${id}/dashboard`;
      } else {
        toast.error(res.error || "Failed to set category");
        setIsPending(false);
        setSelected(null);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsPending(false);
      setSelected(null);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f0ebe0] to-[#faf8f5] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-4 py-12 transition-colors duration-200">
      {/* Corner controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle showLabel />
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-10 max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 mt-4">
          Choose Your Business Type
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Select the module that matches your business. This loads a tailored management system for your shop.
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid gap-5 sm:grid-cols-3 w-full max-w-4xl">
        {CATEGORIES.map((cat) => {
          const c = colorMap[cat.color];
          const Icon = cat.icon;
          const isSelected = selected === cat.id;
          const isLoading = isPending && isSelected;

          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              disabled={isPending}
              className={`group relative flex flex-col gap-4 rounded-2xl border-2 p-6 text-left transition-all duration-200 shadow-sm hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${c.ring} ${
                isSelected
                  ? `${c.bg} ${c.selectedBorder} ring-2 shadow-md`
                  : `bg-white dark:bg-slate-900 ${c.border} hover:${c.bg}`
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                {isLoading ? (
                  <Loader2 className={`h-6 w-6 animate-spin ${c.iconText}`} />
                ) : (
                  <Icon className={`h-6 w-6 ${c.iconText}`} />
                )}
              </div>

              {/* Label + description */}
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {cat.label}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5 mt-auto">
                {cat.features.map((f) => (
                  <span
                    key={f}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.badge}`}
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Arrow indicator */}
              <ArrowRight
                className={`absolute bottom-5 right-5 h-4 w-4 transition-all duration-200 ${c.iconText} ${
                  isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-60 group-hover:translate-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-600 text-center max-w-sm">
        You can switch between business modules later from the sidebar settings if you run multiple businesses.
      </p>
    </div>
  );
}
