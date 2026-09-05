"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIGS } from "@/lib/category-config";
import type { BusinessCategory } from "@/lib/category-config";
import { getOrderReportData } from "@/actions/orders";
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Wallet,
  Receipt,
  RotateCw,
  Printer,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";

export interface OrderReportPayload {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  ordersByStatus: { status: string; count: number }[];
  ordersByType: { type: string; revenue: number; count: number }[];
  expensesByCategory: { category: string; amount: number }[];
  revenueTrend: { date: string; revenue: number; count: number }[];
}

interface OrderReportsProps {
  category: "studio" | "clothing";
  initialData: OrderReportPayload;
}

const PALETTE = [
  "#8b5cf6", // Violet
  "#ec4899", // Rose / Pink
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#f43f5e", // Crimson
  "#14b8a6", // Teal
  "#84cc16", // Lime
];

export function OrderReports({ category, initialData }: OrderReportsProps) {
  const [data, setData] = useState<OrderReportPayload>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Default dates: last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [activeRange, setActiveRange] = useState<string>("30d");

  const cfg = CATEGORY_CONFIGS[category];
  const isStudio = category === "studio";

  const brandText = isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400";
  const brandBg = isStudio ? "bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  const brandStroke = isStudio ? "#8b5cf6" : "#f43f5e";
  const brandGradient = isStudio ? "studioGradient" : "clothingGradient";

  const handleFetchRange = async (start: string, end: string, label?: string) => {
    setStartDate(start);
    setEndDate(end);
    setIsLoading(true);
    try {
      const res = await getOrderReportData(category, start, end);
      if (res.success) {
        if (res.data) {
          setData(res.data);
          if (label) {
            toast.success(`Reports updated for ${label}`);
          } else {
            toast.success("Reports refreshed successfully");
          }
        }
      } else {
        toast.error(res.error || "Failed to load report data");
      }
    } catch {
      toast.error("An error occurred while loading reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreset = (preset: "7d" | "30d" | "month" | "year" | "all") => {
    setActiveRange(preset);
    const now = new Date();
    let start = new Date();

    if (preset === "7d") {
      start.setDate(now.getDate() - 7);
    } else if (preset === "30d") {
      start.setDate(now.getDate() - 30);
    } else if (preset === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === "year") {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (preset === "all") {
      start = new Date(2020, 0, 1);
    }

    const startStr = start.toISOString().split("T")[0];
    const endStr = now.toISOString().split("T")[0];
    handleFetchRange(startStr, endStr);
  };

  const profitMargin =
    data.totalRevenue > 0
      ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1)
      : "0";

  const averageOrderValue =
    data.totalOrders > 0
      ? data.totalRevenue / data.totalOrders
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${brandBg}`}>
              <BarChart3 className="h-3.5 w-3.5" />
              {cfg.label} Analytics
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold font-serif ${brandText}`}>
            Financial & Order Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comprehensive breakdown of revenue, expenses, net profitability, and service distributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFetchRange(startDate, endDate)}
            disabled={isLoading}
            className="text-xs"
          >
            <RotateCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs print:hidden"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs print:hidden">
        {/* Preset Range Tabs */}
        <div className="inline-flex flex-wrap items-center gap-1">
          {[
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "month", label: "This Month" },
            { id: "year", label: "This Year" },
            { id: "all", label: "All Time" },
          ].map((item) => (
            <Button
              key={item.id}
              variant={activeRange === item.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handlePreset(item.id as any)}
              className="text-xs h-8"
            >
              {item.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" /> Range:
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActiveRange("custom");
            }}
            className="h-8 text-xs w-36"
          />
          <span className="text-xs text-slate-400">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActiveRange("custom");
            }}
            className="h-8 text-xs w-36"
          />
          <Button
            size="sm"
            onClick={() => handleFetchRange(startDate, endDate)}
            disabled={isLoading}
            className="h-8 text-xs font-medium"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Apply
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Revenue
            </CardTitle>
            <div className={`p-2 rounded-lg ${brandBg}`}>
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight">
              {formatCurrency(data.totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              From {data.totalOrders} total orders
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Expenses
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.totalRevenue > 0
                ? `${((data.totalExpenses / data.totalRevenue) * 100).toFixed(1)}% of revenue`
                : "No operational spend"}
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Net Profit
            </CardTitle>
            <div className={`p-2 rounded-lg ${data.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
                data.netProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatCurrency(data.netProfit)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              {profitMargin}% net margin
            </p>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Avg Order Value (AOV)
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-sky-600 dark:text-sky-400">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across {data.totalOrders} {cfg.shortLabel.toLowerCase()} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Area Chart */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Revenue Trend Over Time
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Daily breakdown of agreed order amounts and project volumes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.revenueTrend.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Layers className="h-8 w-8 mb-2 opacity-40" />
              No order activity recorded in this date range.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.revenueTrend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={brandGradient} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={brandStroke} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={brandStroke} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => formatDate(val, "dd MMM")}
                    tick={{ fontSize: 11, fill: "#888" }}
                    stroke="#888"
                  />
                  <YAxis
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: "#888" }}
                    stroke="#888"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs space-y-1">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                              {label ? formatDate(label, "dd MMMM yyyy") : ""}
                            </p>
                            <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              Revenue: {formatCurrency(Number(payload[0]?.value) || 0)}
                            </p>
                            <p className="text-slate-500">
                              Orders: {payload[0]?.payload?.count || 0}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={brandStroke}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${brandGradient})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Breakdown by Order Type & Expense Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders by Type */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              {isStudio ? "Revenue by Shoot / Job Type" : "Revenue by Service Type"}
            </CardTitle>
            <CardDescription className="text-xs">
              Performance breakdown across different {cfg.shortLabel.toLowerCase()} categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.ordersByType.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                No categorized order data found.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.ordersByType.slice(0, 7)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: "#888" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="type"
                      tick={{ fontSize: 11, fill: "#888" }}
                      width={100}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-lg text-xs space-y-1">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{item.type}</p>
                              <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                Revenue: {formatCurrency(item.revenue)}
                              </p>
                              <p className="text-slate-500">Orders: {item.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" fill={brandStroke} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-rose-500" />
              Operational Cost Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Direct expenses incurred on equipment, labor, travel, and materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.expensesByCategory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                No expense entries logged in this period.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-56 w-56 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expensesByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {data.expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-md text-xs">
                                <span className="font-semibold">{item.category}</span>:{" "}
                                <span className="font-mono font-bold text-rose-600">
                                  {formatCurrency(item.amount)}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-2">
                  {data.expensesByCategory.map((exp, idx) => {
                    const pct = data.totalExpenses > 0
                      ? ((exp.amount / data.totalExpenses) * 100).toFixed(1)
                      : "0";
                    return (
                      <div key={exp.category} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                            {exp.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{formatCurrency(exp.amount)}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                            {pct}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status Overview */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-sky-500" />
            Order Pipeline Status
          </CardTitle>
          <CardDescription className="text-xs">
            Distribution of jobs currently active or delivered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { status: "received", label: "Received" },
              { status: "in_progress", label: "In Progress" },
              { status: "completed", label: "Completed" },
              { status: "delivered", label: "Delivered" },
            ].map((st) => {
              const found = data.ordersByStatus.find((s) => s.status === st.status);
              const count = found ? found.count : 0;
              return (
                <div
                  key={st.status}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 text-center"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                    {st.label}
                  </p>
                  <p className="text-2xl font-bold font-mono mt-1 text-slate-900 dark:text-slate-100">
                    {count}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <span className="text-[10px] text-slate-400">
                      {data.totalOrders > 0
                        ? `${((count / data.totalOrders) * 100).toFixed(0)}% of total`
                        : "0%"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
