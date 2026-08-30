"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CalendarRange, CalendarClock } from "lucide-react";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today", icon: CalendarDays },
  { value: "month", label: "This Month", icon: CalendarRange },
  { value: "year", label: "This Year", icon: CalendarClock },
] as const;

export function RevenueFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") || "today";

  const handleChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (period === "today") {
      params.delete("period");
    } else {
      params.set("period", period);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-sm">
      {PERIOD_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = current === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={`
              inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200
              ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
                  : "text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-700 dark:hover:text-amber-400"
              }
            `}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
