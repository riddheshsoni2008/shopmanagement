"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReportData, ReportData } from "@/actions/reports";
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Award,
  Wallet,
  ShoppingBag,
  Info,
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

interface ReportsViewProps {
  initialData: ReportData;
}

const COLORS = [
  "#d97706", // Amber / Gold
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#06b6d4", // Cyan
];

export function ReportsView({ initialData }: ReportsViewProps) {
  const [data, setData] = useState<ReportData>(initialData);
  const [startDate, setStartDate] = useState(
    initialData.startDate.split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    initialData.endDate.split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleFilter = async () => {
    setIsLoading(true);
    try {
      const res = await getReportData(startDate, endDate);
      if (res.success) {
        setData(res.data);
        toast.success("Analytics updated for selected date range.");
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to generate analytics report.");
    } finally {
      setIsLoading(false);
    }
  };

  const profitMargin =
    data.totalRevenue > 0
      ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1)
      : "0.0";

  const avgOrderValue =
    data.totalSalesCount > 0
      ? data.totalRevenue / data.totalSalesCount
      : 0;

  // Custom Dark Glassmorphism Tooltip for Area & Bar Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-amber-500/40 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50">
          <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">
            {label}
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-300 font-medium">{payload[0].name || "Revenue"}:</span>
            <span className="font-mono font-bold text-white">
              {formatCurrency(Number(payload[0].value))}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Expenses Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const categoryName = payload[0].name;
      const amount = Number(payload[0].value);
      const pct = data.totalExpenses > 0 ? ((amount / data.totalExpenses) * 100).toFixed(1) : "0.0";
      return (
        <div className="rounded-xl border border-rose-500/40 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50">
          <p className="font-bold text-rose-400 border-b border-slate-800 pb-1 uppercase tracking-wider">
            {categoryName}
          </p>
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <span className="text-slate-300 font-medium">Expense:</span>
            <span className="font-mono font-bold text-white">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 font-medium">Share of Total:</span>
            <span className="font-mono font-bold text-rose-300">{pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Date Filter Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm backdrop-blur-md transition-colors duration-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">From Date:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[135px] sm:w-40 h-10 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">To Date:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[135px] sm:w-40 h-10 text-xs font-mono"
              />
            </div>

            <Button
              onClick={handleFilter}
              disabled={isLoading}
              className="font-semibold shadow-md bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Apply Date Filter"
              )}
            </Button>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
            Active Filter: <strong className="text-slate-900 dark:text-slate-200">{formatDate(data.startDate)}</strong> to{" "}
            <strong className="text-slate-900 dark:text-slate-200">{formatDate(data.endDate)}</strong>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-amber-300 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/80 to-yellow-50/40 dark:from-amber-500/10 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Total Revenue
              </CardTitle>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-300/70 font-medium">કુલ વેચાણ આવક</p>
            </div>
            <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-500/30">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-900 dark:text-amber-300">
              {formatCurrency(data.totalRevenue)}
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              From <strong className="text-slate-900 dark:text-slate-100">{data.totalSalesCount}</strong> total bill(s)
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-rose-300 dark:border-rose-500/30 bg-gradient-to-br from-rose-50/80 to-red-50/40 dark:from-rose-950/20 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
                Total Expenses
              </CardTitle>
              <p className="text-[10px] text-rose-700/80 dark:text-rose-300/70 font-medium">દુકાનનો કુલ ખર્ચ</p>
            </div>
            <div className="rounded-xl bg-rose-500/20 p-2.5 text-rose-700 dark:text-rose-400 border border-rose-300/50 dark:border-rose-500/30">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-900 dark:text-rose-400">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              Operating shop overheads
            </p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={data.netProfit >= 0 ? "border-emerald-300 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-500/10 dark:to-slate-900" : "border-rose-300 dark:border-rose-500/30 bg-gradient-to-br from-rose-50/80 to-red-50/40 dark:from-rose-950/20 dark:to-slate-900"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Net Profit
              </CardTitle>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/70 font-medium">ચોખ્ખો નફો / બચત</p>
            </div>
            <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-700 dark:text-emerald-400 border border-emerald-300/50 dark:border-emerald-500/30">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                data.netProfit >= 0 ? "text-emerald-900 dark:text-emerald-300" : "text-rose-900 dark:text-rose-400"
              }`}
            >
              {formatCurrency(data.netProfit)}
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              Margin: <strong className={data.netProfit >= 0 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-rose-600 font-bold"}>{profitMargin}% profit</strong>
            </p>
          </CardContent>
        </Card>

        {/* Average Bill Value */}
        <Card className="border-sky-300 dark:border-blue-500/30 bg-gradient-to-br from-sky-50/80 to-blue-50/40 dark:from-blue-500/10 dark:to-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-blue-400">
                Avg Order Value
              </CardTitle>
              <p className="text-[10px] text-sky-700/80 dark:text-blue-300/70 font-medium">સરેરાશ બિલની રકમ</p>
            </div>
            <div className="rounded-xl bg-blue-500/20 p-2.5 text-sky-700 dark:text-blue-400 border border-sky-300/50 dark:border-blue-500/30">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {formatCurrency(avgOrderValue)}
            </div>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">Per customer bill sale</p>
          </CardContent>
        </Card>
      </div>

      {/* Easy-to-Understand Financial Explanation Card */}
      <div className="rounded-2xl border border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 dark:from-slate-900 dark:to-slate-900/90 p-4 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-400/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Easy Business Overview Summary (સરળ હિસાબ સમજુતી)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quick financial calculation for selected range
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-amber-200/60 dark:border-slate-800 text-xs">
          <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-slate-500 dark:text-slate-400 font-semibold">1. Total Money Received (આવક)</p>
            <p className="text-lg font-bold font-mono text-amber-800 dark:text-amber-300">
              {formatCurrency(data.totalRevenue)}
            </p>
            <p className="text-[11px] text-slate-500">Total customer payments collected across {data.totalSalesCount} bills.</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="text-slate-500 dark:text-slate-400 font-semibold">2. Total Money Spent (ખર્ચ)</p>
            <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              - {formatCurrency(data.totalExpenses)}
            </p>
            <p className="text-[11px] text-slate-500">Rent, staff salaries, bills & custom operational expenses.</p>
          </div>

          <div className="bg-amber-500/10 dark:bg-amber-400/10 p-3.5 rounded-xl border border-amber-300 dark:border-amber-500/30 space-y-1">
            <p className="text-amber-900 dark:text-amber-300 font-semibold">3. Net Profit Saved (ચોખ્ખી બચત)</p>
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              = {formatCurrency(data.netProfit)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Your actual net earnings after all expenses ({profitMargin}% margin).</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2 border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-lg font-bold">
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" /> Daily Revenue & Sales Performance Trend
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Timeline graph showing daily sales revenue performance (રોજિંદી વેચાણ કમાણીનો આલેખ)
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400 font-mono text-xs">
                {data.salesTrend.length} Data Points
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {data.salesTrend.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                No revenue data recorded for this selected date range.
              </div>
            ) : (
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Daily Sales Revenue"
                      stroke="#d97706"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#f59e0b", stroke: "#78350f", strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: "#fbbf24", stroke: "#ffffff", strokeWidth: 2 }}
                      fillOpacity={1}
                      fill="url(#colorRevenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category Chart & Legend */}
        <Card className="border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-base font-bold">
              <PieIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" /> Expenses Distribution (ખર્ચનું વિભાજન)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of shop expenses by custom categories
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-between">
            {data.expensesByCategory.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                No operating expenses logged in this selected range.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="h-56 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {data.expensesByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="#0f172a"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Expense</span>
                    <span className="text-sm font-extrabold font-mono text-rose-500 dark:text-rose-400">
                      {formatCurrency(data.totalExpenses)}
                    </span>
                  </div>
                </div>

                {/* Clear Colored Category Breakdown Legend Table */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Category Breakdown:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.expensesByCategory.map((exp, idx) => {
                      const pct = data.totalExpenses > 0 ? ((exp.amount / data.totalExpenses) * 100).toFixed(1) : "0.0";
                      const color = COLORS[idx % COLORS.length];
                      return (
                        <div key={exp.category} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">{exp.category}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatCurrency(exp.amount)}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5 font-medium">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Product Revenue Breakdown */}
        <Card className="border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md flex flex-col justify-between">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-base font-bold">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" /> Best-Selling Jewelry Items (સૌથી વધુ વેચાતી વસ્તુઓ)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Highest grossing jewelry products by revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-between">
            {data.categorySalesDistribution.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                No item sales recorded in this selected range.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.categorySalesDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickMargin={5} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="totalRevenue" name="Revenue" fill="#d97706" radius={[8, 8, 0, 0]}>
                        {data.categorySalesDistribution.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Item Ranking List */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Item Performance Ranking:
                  </p>
                  <div className="space-y-1.5">
                    {data.categorySalesDistribution.slice(0, 5).map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2.5 truncate">
                          <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-amber-500 text-white shrink-0">
                            #{index + 1}
                          </Badge>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">{item.category}</span>
                        </div>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0">
                          {formatCurrency(item.totalRevenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
