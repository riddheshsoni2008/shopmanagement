"use client";

import { useState } from "react";
import { Download, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateSalesStatementPDF,
  SalesStatementPDFItem,
} from "@/lib/pdf-generator";
import { getRateSettings } from "@/actions/settings";
import { bulkDeleteSales } from "@/actions/sales";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SalesStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Array<any>;
}

export function SalesStatementModal({
  isOpen,
  onClose,
  sales,
}: SalesStatementModalProps) {
  const router = useRouter();
  const [periodPreset, setPeriodPreset] = useState<"weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [autoDeleteAfterDownload, setAutoDeleteAfterDownload] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      toast.loading("Preparing official sales transaction statement PDF...", { id: "sales-pdf-toast" });

      const now = new Date();
      let start: Date;
      let end = new Date();
      end.setHours(23, 59, 59, 999);
      let periodLabel = "";

      if (periodPreset === "weekly") {
        start = new Date();
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        periodLabel = `Weekly Sales Statement (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} - ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
      } else if (periodPreset === "monthly") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const monthName = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
        periodLabel = `Monthly Sales Statement (${monthName})`;
      } else if (periodPreset === "yearly") {
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        periodLabel = `Yearly Sales Statement (Year ${now.getFullYear()})`;
      } else {
        if (!customStartDate) {
          toast.error("Please select a valid start date for custom statement", { id: "sales-pdf-toast" });
          setIsGenerating(false);
          return;
        }
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
        }
        periodLabel = `Custom Sales Statement (${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})`;
      }

      // Filter sales for selected statement window
      const periodSales = sales.filter((s) => {
        const d = new Date(s.createdAt);
        return d >= start && d <= end;
      });

      if (periodSales.length === 0) {
        toast.error("No sales records found for the selected statement period.", { id: "sales-pdf-toast" });
        setIsGenerating(false);
        return;
      }

      let totalRevenue = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let partialCount = 0;

      const formattedPDFItems: SalesStatementPDFItem[] = periodSales.map((s) => {
        const amt = Number(s.totalAmount) || 0;
        totalRevenue += amt;

        const st = (s.paymentStatus || "PAID").toUpperCase();
        if (st === "PENDING") pendingCount++;
        else if (st === "PARTIAL") partialCount++;
        else paidCount++;

        return {
          invoiceId: s._id,
          date: s.createdAt,
          customerName: s.customerName || "Customer",
          customerPhone: s.customerPhone || "N/A",
          itemsCount: s.itemsCount || s.items?.length || 1,
          paymentStatus: st,
          paymentMethod: s.paymentMethod || "Cash",
          soldBy: s.soldBy?.name || "Staff",
          totalAmount: amt,
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
      await generateSalesStatementPDF({
        shopName,
        periodLabel,
        totalRevenue,
        totalSalesCount: periodSales.length,
        paidCount,
        pendingCount,
        partialCount,
        sales: formattedPDFItems,
      });

      // Auto-Delete downloaded sales data from database if option enabled
      if (autoDeleteAfterDownload) {
        const saleIds = periodSales.map((s) => s._id);
        const delRes = await bulkDeleteSales(saleIds);
        if (delRes.success) {
          toast.success(
            `Statement downloaded & ${delRes.data?.deletedCount || periodSales.length} sales invoice(s) auto-cleared from DB!`,
            { id: "sales-pdf-toast" }
          );
        } else {
          toast.success("Statement downloaded successfully!", { id: "sales-pdf-toast" });
        }
        router.refresh();
      } else {
        toast.success("Sales statement PDF downloaded successfully!", { id: "sales-pdf-toast" });
      }

      onClose();
    } catch (err: any) {
      console.error("Sales statement PDF error:", err);
      toast.error("Failed to generate sales statement PDF.", { id: "sales-pdf-toast" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Sales Statement PDF
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate bank-style sales revenue report
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

          {/* Auto-delete Toggle Option */}
          <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/30 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="autoDeleteSalesCheckbox"
              checked={autoDeleteAfterDownload}
              onChange={(e) => setAutoDeleteAfterDownload(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer shrink-0"
            />
            <label htmlFor="autoDeleteSalesCheckbox" className="text-[11px] font-semibold text-rose-900 dark:text-rose-300 leading-snug cursor-pointer">
              Automatically delete downloaded sales records from database after successful export
            </label>
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
