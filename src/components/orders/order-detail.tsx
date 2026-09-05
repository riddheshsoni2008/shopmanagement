"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { CATEGORY_CONFIGS, ORDER_STATUSES } from "@/lib/category-config";
import type { OrderDetail as IOrderDetail } from "@/actions/orders";
import { updateOrderStatus } from "@/actions/orders";
import { addOrderExpense, deleteOrderExpense } from "@/actions/orderExpenses";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, DollarSign, TrendingUp,
  Coins, Clock, MapPin, User2, Ruler, Layers, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  received: "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/40",
  in_progress: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
  completed: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  delivered: "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-500/40",
};

interface OrderDetailViewProps {
  order: IOrderDetail;
  category: "studio" | "clothing";
  userRole: "admin" | "staff";
}

export function OrderDetailView({ order: initialOrder, category, userRole }: OrderDetailViewProps) {
  const cfg = CATEGORY_CONFIGS[category];
  const base = `/dashboard/${category}`;
  const isStudio = category === "studio";
  const [order, setOrder] = useState(initialOrder);
  const [expenses, setExpenses] = useState(initialOrder.expenses);
  const [isPending, startTransition] = useTransition();

  const [expForm, setExpForm] = useState({
    category: cfg.expenseCategories[0] || "",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });

  const accentText = isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400";
  const accentBtn = isStudio ? "bg-violet-600 hover:bg-violet-700" : "bg-rose-600 hover:bg-rose-700";

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = order.agreedAmount - totalExpenses;
  const balanceDue = Math.max(0, order.agreedAmount - order.advanceReceived);

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(order._id, status as any);
      if (res.success) {
        setOrder((prev) => ({ ...prev, status: status as any }));
        toast.success("Status updated");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!expForm.category) {
      toast.error("Select a category");
      return;
    }
    startTransition(async () => {
      const res = await addOrderExpense({
        orderId: order._id,
        category: expForm.category,
        amount,
        note: expForm.note,
        date: expForm.date,
      });
      if (res.success) {
        setExpenses((prev) => [
          ...prev,
          {
            _id: res.data,
            category: expForm.category,
            amount,
            note: expForm.note,
            date: new Date(expForm.date).toISOString(),
            addedBy: { name: "You" },
          },
        ]);
        setExpForm((prev) => ({ ...prev, amount: "", note: "" }));
        toast.success("Expense added");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (!confirm("Remove this expense?")) return;
    startTransition(async () => {
      const res = await deleteOrderExpense(id);
      if (res.success) {
        setExpenses((prev) => prev.filter((e) => e._id !== id));
        toast.success("Expense removed");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <Link href={`${base}/orders`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`font-mono text-sm font-bold ${accentText}`}>{order.orderNumber}</span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[order.status] || ""}`}>
              {ORDER_STATUSES.find((s) => s.value === order.status)?.label}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {order.clientName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {order.orderType} · {formatDate(order.orderDate)}
          </p>
        </div>
        {/* Status Changer */}
        <select
          value={order.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isPending}
          className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Financials */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className={isStudio ? "border-violet-300 dark:border-violet-500/30 bg-violet-50/70 dark:bg-violet-500/10" : "border-rose-300 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10"}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Agreed</p>
                <p className={`text-lg font-bold font-mono ${accentText}`}>{formatCurrency(order.agreedAmount)}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-300 dark:border-amber-500/30">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Advance</p>
                <p className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400">{formatCurrency(order.advanceReceived)}</p>
              </CardContent>
            </Card>
            <Card className={balanceDue > 0 ? "border-orange-300 dark:border-orange-500/30" : "border-emerald-300 dark:border-emerald-500/30"}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Balance Due</p>
                <p className={`text-lg font-bold font-mono ${balanceDue > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {balanceDue > 0 ? formatCurrency(balanceDue) : "Paid"}
                </p>
              </CardContent>
            </Card>
            <Card className={profit >= 0 ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10" : "border-rose-300 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/10"}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Profit</p>
                <p className={`text-lg font-bold font-mono ${profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                  {formatCurrency(profit)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Order Expenses</CardTitle>
                <CardDescription>Costs incurred to fulfil this order</CardDescription>
              </div>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(totalExpenses)} total
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add expense form */}
              <form onSubmit={handleAddExpense} className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Add Expense</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <select
                    value={expForm.category}
                    onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value }))}
                    disabled={isPending}
                    className="col-span-2 sm:col-span-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2"
                  >
                    {cfg.expenseCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount ₹"
                    value={expForm.amount}
                    onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))}
                    disabled={isPending}
                    className="h-9"
                  />
                  <Input
                    placeholder="Note (optional)"
                    value={expForm.note}
                    onChange={(e) => setExpForm((p) => ({ ...p, note: e.target.value }))}
                    disabled={isPending}
                    className="h-9"
                  />
                  <Input
                    type="date"
                    value={expForm.date}
                    onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))}
                    disabled={isPending}
                    className="h-9"
                  />
                </div>
                <Button type="submit" size="sm" disabled={isPending} className={`text-white ${accentBtn}`}>
                  {isPending ? "Adding..." : <><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Expense</>}
                </Button>
              </form>

              {/* Expense list */}
              {expenses.length === 0 ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-600 py-4">No expenses logged yet</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <div key={exp._id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{exp.category}</span>
                        {exp.note && <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">— {exp.note}</span>}
                        <div className="text-xs text-slate-400 dark:text-slate-500">{formatDate(exp.date)} · {exp.addedBy.name}</div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(exp.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(exp._id)}
                          disabled={isPending}
                          className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right col — order info */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-700 dark:text-slate-300">Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{order.clientName}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{order.clientPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">Order Date</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(order.orderDate)}</p>
                </div>
              </div>
              {order.dueDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Due Date</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(order.dueDate)}</p>
                  </div>
                </div>
              )}
              {order.description && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {order.description}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Studio extras */}
          {isStudio && order.studioExtra && (order.studioExtra.photographerName || order.studioExtra.venueAddress) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-700 dark:text-slate-300">Studio Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.studioExtra.photographerName && (
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Photographer</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{order.studioExtra.photographerName}</p>
                    </div>
                  </div>
                )}
                {order.studioExtra.venueAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-violet-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Venue</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{order.studioExtra.venueAddress}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clothing extras */}
          {!isStudio && order.clothingExtra && (order.clothingExtra.measurementNotes || order.clothingExtra.fabricDetails) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-700 dark:text-slate-300">Garment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {order.clothingExtra.measurementNotes && (
                  <div className="flex items-start gap-2">
                    <Ruler className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Measurements</p>
                      <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{order.clothingExtra.measurementNotes}</p>
                    </div>
                  </div>
                )}
                {order.clothingExtra.fabricDetails && (
                  <div className="flex items-start gap-2">
                    <Layers className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Fabric</p>
                      <p className="text-slate-700 dark:text-slate-300 text-xs">{order.clothingExtra.fabricDetails}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
