"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { ExpenseStatementModal } from "@/components/expenses/expense-statement-modal";
import { deleteExpense, bulkDeleteExpenses } from "@/actions/expenses";
import { toast } from "sonner";
import { expenseCategories } from "@/lib/validators/expense";

interface ExpenseViewProps {
  initialData: {
    expenses: Array<any>;
    categoryTotals: Record<string, number>;
    totalExpenses: number;
  };
}

export function ExpenseView({ initialData }: ExpenseViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);

  const filteredExpenses = initialData.expenses.filter((e) => {
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    if (startDate && new Date(e.date) < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(e.date) > end) return false;
    }
    return true;
  });

  const isAllSelected =
    filteredExpenses.length > 0 &&
    selectedExpenseIds.length === filteredExpenses.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExpenseIds(filteredExpenses.map((e) => e._id));
    } else {
      setSelectedExpenseIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedExpenseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, category: string, amount: number) => {
    if (!confirm(`Are you sure you want to delete this ${category} expense of ${formatCurrency(amount)}?`)) {
      return;
    }
    try {
      const res = await deleteExpense(id);
      if (res.success) {
        toast.success("Expense entry deleted");
        setSelectedExpenseIds((prev) => prev.filter((item) => item !== id));
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to delete expense entry.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExpenseIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedExpenseIds.length} selected expense record(s)?`)) {
      return;
    }
    try {
      const res = await bulkDeleteExpenses(selectedExpenseIds);
      if (res.success) {
        toast.success(`Successfully deleted ${res.data?.deletedCount || selectedExpenseIds.length} expense record(s).`);
        setSelectedExpenseIds([]);
      } else {
        toast.error(res.error || "Failed to delete expenses");
      }
    } catch (err) {
      toast.error("Failed to delete selected expenses.");
    }
  };

  // Dynamically include any custom categories present in data alongside standard categories
  const allCategoryOptions = Array.from(
    new Set([
      ...expenseCategories.filter((c) => c !== "Other"),
      ...Object.keys(initialData.categoryTotals || {}),
      ...initialData.expenses.map((e) => e.category),
    ])
  ).filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Category Breakdown Cards Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-rose-300 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/10 col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Total Expenses
            </CardTitle>
            <div className="rounded-lg bg-rose-100 dark:bg-rose-500/20 p-2 text-rose-700 dark:text-rose-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-400">
              {formatCurrency(initialData.totalExpenses)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {initialData.expenses.length} entry/entries
            </p>
          </CardContent>
        </Card>

        {Object.entries(initialData.categoryTotals).slice(0, 3).map(([cat, total]) => (
          <Card key={cat}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {cat}
              </CardTitle>
              <Tag className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(total)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Category spending</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Header & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 sm:p-4 shadow-sm backdrop-blur-md transition-colors duration-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-44"
          >
            <option value="ALL">All Categories</option>
            {allCategoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold shrink-0">From:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[130px] sm:w-36 h-10 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold shrink-0">To:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[130px] sm:w-36 h-10 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-amber-100 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="checkbox"
              id="selectAllExpensesHeader"
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
            />
            <label htmlFor="selectAllExpensesHeader" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Select All ({filteredExpenses.length})
            </label>

            {selectedExpenseIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="font-bold text-xs ml-2 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Selected ({selectedExpenseIds.length})
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setStatementModalOpen(true)}
              className="font-semibold w-full sm:w-auto border-amber-300 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <Download className="mr-1.5 h-4 w-4 text-amber-600 dark:text-amber-400" /> Export Statement PDF
            </Button>

            <Button onClick={() => setDialogOpen(true)} className="font-bold w-full sm:w-auto">
              <Plus className="mr-1.5 h-4 w-4" /> Log New Expense
            </Button>
          </div>
        </div>
      </div>

      {/* Expense List — Daily Grouped Cards Layout */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-900/40 py-16 text-center">
          <DollarSign className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">No Expense Entries</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            No operating expenses match your selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const dailyGroupsMap: Record<string, { dateStr: string; formattedDate: string; total: number; items: any[] }> = {};
            filteredExpenses.forEach((expense: any) => {
              const dateKey = new Date(expense.date).toISOString().split("T")[0];
              if (!dailyGroupsMap[dateKey]) {
                dailyGroupsMap[dateKey] = {
                  dateStr: dateKey,
                  formattedDate: formatDate(expense.date),
                  total: 0,
                  items: [],
                };
              }
              dailyGroupsMap[dateKey].items.push(expense);
              dailyGroupsMap[dateKey].total += expense.amount;
            });
            const dailyGroups = Object.values(dailyGroupsMap);

            return dailyGroups.map((group: any) => (
              <Card
                key={group.dateStr}
                className="border-amber-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden"
              >
              {/* Daily Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 border-b border-amber-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {group.formattedDate}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Daily Total:</span>
                  <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-2.5 py-1 shadow-sm">
                    {formatCurrency(group.total)}
                  </Badge>
                </div>
              </div>

              {/* Items List in Daily Document */}
              <div className="divide-y divide-amber-100 dark:divide-slate-800/60">
                {group.items.map((expense: any) => {
                  const isSelected = selectedExpenseIds.includes(expense._id);
                  return (
                    <div
                      key={expense._id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-3 transition-colors ${
                        isSelected
                          ? "bg-amber-50/60 dark:bg-amber-950/20"
                          : "hover:bg-amber-50/30 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(expense._id)}
                          className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer mt-1 sm:mt-0 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {expense.category}
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              Logged by {expense.addedBy?.name || "Admin"}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                            {expense.note || "No note recorded"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0">
                        <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(expense.amount)}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense._id, expense.category, expense.amount)}
                          className="h-8 w-8 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 dark:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ));
        })()}
      </div>
      )}

      {/* Expense Dialog */}
      <ExpenseDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {/* Expense Statement PDF Modal */}
      <ExpenseStatementModal
        isOpen={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        expenses={initialData.expenses}
      />
    </div>
  );
}
