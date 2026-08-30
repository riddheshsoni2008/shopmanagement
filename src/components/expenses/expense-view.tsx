"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { deleteExpense } from "@/actions/expenses";
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

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const handleDelete = async (id: string, category: string, amount: number) => {
    if (!confirm(`Are you sure you want to delete this ${category} expense of ${formatCurrency(amount)}?`)) {
      return;
    }
    try {
      const res = await deleteExpense(id);
      if (res.success) {
        toast.success("Expense entry deleted");
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to delete expense entry.");
    }
  };

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
            {expenseCategories.map((c) => (
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

        <div className="sm:self-end">
          <Button onClick={() => setDialogOpen(true)} className="font-bold w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" /> Log New Expense
          </Button>
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-900/40 py-16 text-center">
          <DollarSign className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">No Expense Entries</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            No operating expenses match your selected filters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="space-y-3 md:hidden">
            {filteredExpenses.map((expense) => (
              <div
                key={expense._id}
                className="rounded-xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge variant="outline" className="mb-1">{expense.category}</Badge>
                    <p className="text-sm text-slate-800 dark:text-slate-300 font-medium mt-1">
                      {expense.note || "No note recorded"}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400 shrink-0">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-amber-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(expense.date)} • {expense.addedBy?.name || "Admin"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(expense._id, expense.category, expense.amount)}
                    className="h-8 w-8 hover:bg-rose-500/10 -mr-2"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description / Memo</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expense Date</TableHead>
                  <TableHead>Logged By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>

                    <TableCell className="text-slate-800 dark:text-slate-300 font-medium">
                      {expense.note || "No note recorded"}
                    </TableCell>

                    <TableCell className="font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(expense.amount)}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(expense.date)}
                    </TableCell>

                    <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                      {expense.addedBy?.name || "Admin"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense._id, expense.category, expense.amount)}
                        className="h-8 w-8 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Expense Modal */}
      <ExpenseDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
