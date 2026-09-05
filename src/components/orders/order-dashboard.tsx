"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIGS, ORDER_STATUSES } from "@/lib/category-config";
import type { BusinessCategory } from "@/lib/category-config";
import type { OrderDashboardMetrics } from "@/actions/orders";
import {
  TrendingUp, DollarSign, Coins, ClipboardList,
  Clock, CheckCircle2, Plus, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, string> = {
  received: "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/40",
  in_progress: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
  completed: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  delivered: "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-500/40",
};

interface OrderDashboardProps {
  category: "studio" | "clothing";
  metrics: OrderDashboardMetrics;
}

export function OrderDashboard({ category, metrics }: OrderDashboardProps) {
  const cfg = CATEGORY_CONFIGS[category];
  const base = `/dashboard/${category}`;
  const isStudio = category === "studio";

  const accentRevenue = isStudio
    ? "border-violet-300 dark:border-violet-500/30 bg-violet-50/70 dark:bg-violet-500/10"
    : "border-rose-300 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10";
  const accentText = isStudio
    ? "text-violet-700 dark:text-violet-400"
    : "text-rose-700 dark:text-rose-400";
  const accentIcon = isStudio
    ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400"
    : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-serif ${accentText}`}>
            {cfg.label} — Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            This month&apos;s revenue, expenses, and order overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`${base}/orders/new`}>
            <Button size="sm" className="font-semibold text-xs sm:text-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Order
            </Button>
          </Link>
          <Link href={`${base}/orders`}>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className={accentRevenue}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              This Month&apos;s Revenue
            </CardTitle>
            <div className={`rounded-lg p-2 shrink-0 ${accentIcon}`}>
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold font-mono truncate ${accentText}`}>
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {metrics.totalOrders} order(s) this period
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-300 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Total Expenses
            </CardTitle>
            <div className="rounded-lg p-2 shrink-0 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400 truncate">
              {formatCurrency(metrics.totalExpenses)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Per-order costs</p>
          </CardContent>
        </Card>

        <Card className={metrics.totalProfit >= 0
          ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-500/10"
          : "border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/10"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Net Profit
            </CardTitle>
            <div className={`rounded-lg p-2 shrink-0 ${metrics.totalProfit >= 0 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"}`}>
              <Coins className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold font-mono truncate ${metrics.totalProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
              {formatCurrency(metrics.totalProfit)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Revenue − Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Active Orders
            </CardTitle>
            <div className="rounded-lg p-2 shrink-0 bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {metrics.pendingOrders}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {metrics.completedOrders} completed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-slate-100">Recent Orders</CardTitle>
            <CardDescription>Latest jobs from this period</CardDescription>
          </div>
          <Link href={`${base}/orders`}>
            <Button variant="ghost" size="sm" className={`text-xs ${accentText}`}>
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {metrics.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No orders yet this period</p>
              <Link href={`${base}/orders/new`} className="mt-3">
                <Button size="sm">Create First Order</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.recentOrders.map((order) => (
                <Link key={order._id} href={`${base}/orders/${order._id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                          {order.orderNumber}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[order.status] || ""}`}>
                          {ORDER_STATUSES.find((s) => s.value === order.status)?.label || order.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                        {order.clientName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {order.orderType} · {formatDate(order.orderDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`text-sm font-bold font-mono ${accentText}`}>
                        {formatCurrency(order.agreedAmount)}
                      </p>
                      {order.balanceDue > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          ₹{order.balanceDue.toLocaleString("en-IN")} due
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
