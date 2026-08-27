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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const COLORS = ["#d97706", "#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

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

  return (
    <div className="space-y-8">
      {/* Date Filter Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur-md">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">From Date:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40 h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">To Date:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40 h-10 text-xs"
            />
          </div>

          <Button
            onClick={handleFilter}
            disabled={isLoading}
            className="font-semibold shadow-md"
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

        <div className="text-xs text-slate-400">
          Showing range: <strong className="text-slate-200">{formatDate(data.startDate)}</strong> to{" "}
          <strong className="text-slate-200">{formatDate(data.endDate)}</strong>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Revenue
            </CardTitle>
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {formatCurrency(data.totalRevenue)}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {data.totalSalesCount} total bill(s) issued
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Expenses
            </CardTitle>
            <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="mt-1 text-xs text-slate-400">Operating overheads</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={data.netProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Net Profit
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatCurrency(data.netProfit)}
            </div>
            <p className="mt-1 text-xs text-slate-400">Revenue minus expenses</p>
          </CardContent>
        </Card>

        {/* Average Bill Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Average Order Value
            </CardTitle>
            <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {formatCurrency(
                data.totalSalesCount > 0 ? data.totalRevenue / data.totalSalesCount : 0
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Per customer transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-400" /> Revenue & Sales Trend
            </CardTitle>
            <CardDescription>Daily sales performance timeline</CardDescription>
          </CardHeader>
          <CardContent>
            {data.salesTrend.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No revenue data recorded for this date range.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        color: "#f8fafc",
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-rose-400" /> Expenses Breakdown
            </CardTitle>
            <CardDescription>Operating expense allocation</CardDescription>
          </CardHeader>
          <CardContent>
            {data.expensesByCategory.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No expenses logged in selected range.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {data.expensesByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        color: "#f8fafc",
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), "Amount"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Product Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-400" /> Top Item Revenue
            </CardTitle>
            <CardDescription>Highest grossing jewelry items</CardDescription>
          </CardHeader>
          <CardContent>
            {data.categorySalesDistribution.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No item sales recorded.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categorySalesDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="category" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        color: "#f8fafc",
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), "Total Revenue"]}
                    />
                    <Bar dataKey="totalRevenue" fill="#d97706" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
