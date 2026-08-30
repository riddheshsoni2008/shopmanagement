import { getDashboardMetrics, DashboardPeriod } from "@/actions/reports";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Suspense } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Gem,
  Plus,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueFilter } from "@/components/dashboard/revenue-filter";

export const revalidate = 0; // SSR live rendering

const VALID_PERIODS = ["today", "month", "year"] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";

  const params = await searchParams;
  const rawPeriod = typeof params.period === "string" ? params.period : "today";
  const period: DashboardPeriod = VALID_PERIODS.includes(rawPeriod as any)
    ? (rawPeriod as DashboardPeriod)
    : "today";

  const metricsRes = await getDashboardMetrics(period);
  const metrics = metricsRes.success ? metricsRes.data : null;

  const periodRevenue = metrics?.periodSalesTotal || 0;
  const periodExpenses = metrics?.periodExpensesTotal || 0;
  const periodNetProfit = periodRevenue - periodExpenses;
  const periodLabel = metrics?.periodLabel || "Today";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-amber-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-amber-700 dark:text-amber-400 sm:text-3xl">
            Store Overview & Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real-time sales performance, stock levels, and daily shop metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sales/new">
            <Button className="font-semibold shadow-md">
              <Plus className="mr-1.5 h-4 w-4" /> Create Sale Bill
            </Button>
          </Link>
          <Link href="/stock">
            <Button variant="outline">
              <Gem className="mr-1.5 h-4 w-4" /> View Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Revenue Period Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-500 to-amber-600"></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Revenue Overview
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing metrics for <span className="font-semibold text-amber-600 dark:text-amber-400">{periodLabel}</span>
            </p>
          </div>
        </div>
        <Suspense fallback={<div className="h-9 w-64 rounded-xl bg-amber-100/50 dark:bg-slate-800 animate-pulse" />}>
          <RevenueFilter />
        </Suspense>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Period Sales Total (Revenue) */}
        <Card className="border-amber-300 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {periodLabel}&apos;s Revenue (Selling)
            </CardTitle>
            <div className="rounded-lg bg-amber-100 dark:bg-amber-500/20 p-2 text-amber-700 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(periodRevenue)}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {metrics?.periodSalesCount || 0} completed transaction(s)
            </p>
          </CardContent>
        </Card>

        {/* Period Expenses (Admin Only) */}
        {isAdmin ? (
          <Card className="border-rose-300 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-950/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {periodLabel}&apos;s Expenses
              </CardTitle>
              <div className="rounded-lg bg-rose-100 dark:bg-rose-500/20 p-2 text-rose-700 dark:text-rose-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                {formatCurrency(periodExpenses)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Logged operating expenses</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Total Products
              </CardTitle>
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-500/20 p-2 text-emerald-700 dark:text-emerald-400">
                <Gem className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {metrics?.totalProductsCount || 0}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active catalog items</p>
            </CardContent>
          </Card>
        )}

        {/* Period Net Profit (Selling Revenue - Expenses) */}
        {isAdmin && (
          <Card
            className={
              periodNetProfit >= 0
                ? "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-500/10"
                : "border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/10"
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {periodLabel}&apos;s Net Profit
              </CardTitle>
              <div
                className={`rounded-lg p-2 ${
                  periodNetProfit >= 0
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                }`}
              >
                <Coins className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  periodNetProfit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {formatCurrency(periodNetProfit)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Selling − Expenses</p>
            </CardContent>
          </Card>
        )}

        {/* Period Sales Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {periodLabel}&apos;s Bills
            </CardTitle>
            <div className="rounded-lg bg-sky-100 dark:bg-blue-500/20 p-2 text-sky-700 dark:text-blue-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics?.periodSalesCount || 0}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bills issued {periodLabel.toLowerCase() === "today" ? "today" : `in ${periodLabel}`}</p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className={metrics?.lowStockCount ? "border-rose-300 dark:border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Low Stock Alerts
            </CardTitle>
            <div
              className={`rounded-lg p-2 ${
                metrics?.lowStockCount
                  ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 animate-pulse"
                  : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics?.lowStockCount || 0}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {metrics?.lowStockCount ? "Items require immediate restock" : "All item levels optimal"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Low Stock Warnings & Recent Sales */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales History */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100">Recent Store Transactions</CardTitle>
              <CardDescription>Latest billing invoices generated</CardDescription>
            </div>
            <Link href="/sales">
              <Button variant="ghost" size="sm" className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!metrics?.recentSales || metrics.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No sales recorded yet today</p>
                <Link href="/sales/new" className="mt-3">
                  <Button size="sm">Create First Sale</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.recentSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-200">
                        {sale.customerName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.itemsCount} pc(s)</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(sale.totalAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                        {formatDateTime(sale.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items Panel */}
        <Card className="border-rose-300 dark:border-rose-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="h-5 w-5" /> Restock Urgently
              </CardTitle>
              <CardDescription>Items at or below threshold</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {!metrics?.lowStockProducts || metrics.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-400 mb-2">
                  <Gem className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-300">Inventory healthy!</p>
                <p className="text-xs text-slate-500 mt-1">No products are low on stock.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 p-3"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {product.metal} • {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="lowStock">
                        {product.quantity} left
                      </Badge>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        Min: {product.lowStockThreshold}
                      </span>
                    </div>
                  </div>
                ))}
                <Link href="/stock" className="block pt-2">
                  <Button variant="outline" className="w-full text-xs">
                    Manage Inventory Stock
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
