"use client";

import { useState } from "react";
import { Download, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateExpenseStatementPDF,
  ExpenseStatementPDFItem,
} from "@/lib/pdf-generator";
import { getRateSettings } from "@/actions/settings";
import { toast } from "sonner";

interface ExpenseStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Array<any>;
}

export function ExpenseStatementModal({
  isOpen,
  onClose,
  expenses,
}: ExpenseStatementModalProps) {
  const [periodPreset, setPeriodPreset] = useState<"weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      toast.loading("Preparing official expense statement PDF...", { id: "pdf-toast" });

      const now = new Date();
      let start: Date;
      let end = new Date();
      end.setHours(23, 59, 59, 999);
      let periodLabel = "";

      if (periodPreset === "weekly") {
        start = new Date();
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        periodLabel = `Weekly Statement (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
      } else if (periodPreset === "monthly") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const monthName = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
        periodLabel = `Monthly Statement (${monthName})`;
      } else if (periodPreset === "yearly") {
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        periodLabel = `Yearly Statement (Year ${now.getFullYear()})`;
      } else {
        if (!customStartDate) {
          toast.error("Please select a valid start date for custom statement", { id: "pdf-toast" });
          setIsGenerating(false);
          return;
        }
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        }
        periodLabel = `Custom Statement (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
      }

      // Filter expenses for selected statement window
      const periodExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });

      if (periodExpenses.length === 0) {
        toast.error("No expense records found for the selected statement period.", { id: "pdf-toast" });
        setIsGenerating(false);
        return;
      }

      // Compute Category Totals & Total Amount
      const categoryTotals: Record<string, number> = {};
      let totalExpenses = 0;

      const formattedPDFItems: ExpenseStatementPDFItem[] = periodExpenses.map((e) => {
        const amt = Number(e.amount) || 0;
        totalExpenses += amt;
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amt;

        return {
          date: e.date,
          category: e.category,
          note: e.note || "No memo recorded",
          addedBy: e.addedBy?.name || "Admin",
          amount: amt,
        };
      });

      // Fetch shop settings name
      let shopName = "Zeal Jewellers";
      try {
        const rateRes = await getRateSettings();
        if (rateRes.success && rateRes.data?.shopName) {
          shopName = rateRes.data.shopName;
        }
      } catch (e) {
        // Fallback default
      }

      // Generate & Trigger Browser Auto-Download
      await generateExpenseStatementPDF({
        shopName,
        periodLabel,
        totalExpenses,
        totalEntries: periodExpenses.length,
        categoryTotals,
        expenses: formattedPDFItems,
      });

      toast.success("Statement PDF downloaded! Temporary file auto-cleared.", { id: "pdf-toast" });
      onClose();
    } catch (err: any) {
      console.error("Statement PDF error:", err);
      toast.error("Failed to generate PDF statement. Please try again.", { id: "pdf-toast" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Expense Statement PDF
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate bank-style official expense report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Statement Period Range:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPeriodPreset("weekly")}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                periodPreset === "weekly"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-amber-300 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold">Weekly</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Past 7 days</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPeriodPreset("monthly")}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                periodPreset === "monthly"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-amber-300 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold">Monthly</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Current month</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPeriodPreset("yearly")}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                periodPreset === "yearly"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-amber-300 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold">Yearly</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Current year</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPeriodPreset("custom")}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                periodPreset === "custom"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-amber-300 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold">Custom Range</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Pick dates</p>
              </div>
            </button>
          </div>

          {periodPreset === "custom" && (
            <div className="pt-2 space-y-3 bg-amber-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-amber-100 dark:border-slate-800 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">From Date:</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">To Date:</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              Statements are generated client-side and saved directly to your device. Temporary download blobs are automatically cleaned up immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-amber-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isGenerating} type="button">
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            type="button"
            className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Download className="mr-1.5 h-4 w-4" /> Download PDF Statement
          </Button>
        </div>
      </div>
    </div>
  );
}
