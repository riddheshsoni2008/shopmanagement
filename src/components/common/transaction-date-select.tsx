"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

interface TransactionDateSelectProps {
  onSelectRange: (startDateStr: string, endDateStr: string, label?: string) => void;
  selectedStartDate?: string;
  selectedEndDate?: string;
  className?: string;
}

function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TransactionDateSelect({
  onSelectRange,
  selectedStartDate = "",
  selectedEndDate = "",
  className = "",
}: TransactionDateSelectProps) {
  const [currentVal, setCurrentVal] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    setCurrentVal(val);

    const now = new Date();

    if (val === "PRESET_TODAY") {
      const todayStr = toLocalDateStr(now);
      onSelectRange(todayStr, todayStr, "Today");
    } else if (val === "PRESET_YESTERDAY") {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const yStr = toLocalDateStr(y);
      onSelectRange(yStr, yStr, "Yesterday");
    } else if (val === "PRESET_THIS_WEEK") {
      const w = new Date();
      w.setDate(now.getDate() - 7);
      onSelectRange(toLocalDateStr(w), toLocalDateStr(now), "This Week");
    } else if (val === "PRESET_THIS_MONTH") {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      onSelectRange(toLocalDateStr(m), toLocalDateStr(now), "This Month");
    } else if (val === "PRESET_THIS_YEAR") {
      const yr = new Date(now.getFullYear(), 0, 1);
      onSelectRange(toLocalDateStr(yr), toLocalDateStr(now), "This Year");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center min-w-[200px] sm:min-w-[240px]">
        <CalendarDays className="absolute left-3 h-4 w-4 text-amber-600 dark:text-amber-400 pointer-events-none z-10" />
        <select
          value={currentVal}
          onChange={handleChange}
          className="w-full h-10 pl-9 pr-8 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-slate-800/90 text-slate-800 dark:text-amber-300 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all cursor-pointer truncate shadow-sm"
        >
          <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-500">
            ⚡ Quick Period (સમયગાળો પસંદ કરો)
          </option>
          <option value="PRESET_TODAY" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium py-1">
            📅 Today (આજે)
          </option>
          <option value="PRESET_YESTERDAY" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium py-1">
            ⏪ Yesterday (ગઇકાલે)
          </option>
          <option value="PRESET_THIS_WEEK" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium py-1">
            📊 This Week (આ અઠવાડિયે - Past 7 Days)
          </option>
          <option value="PRESET_THIS_MONTH" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium py-1">
            🗓️ This Month (આ મહિને - Current Month)
          </option>
          <option value="PRESET_THIS_YEAR" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium py-1">
            🏆 This Year (આ વર્ષે - Current Year)
          </option>
        </select>
      </div>
    </div>
  );
}
