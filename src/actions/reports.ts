"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Sale } from "@/models/Sale";
import { Expense } from "@/models/Expense";
import { Product } from "@/models/Product";
import { ActionResult } from "@/actions/auth";
import { getTenantId } from "@/lib/tenant";

export type DashboardPeriod = "today" | "month" | "year";

export interface DashboardMetrics {
  periodLabel: string;
  periodSalesTotal: number;
  periodSalesCount: number;
  periodExpensesTotal: number;
  totalProductsCount: number;
  lowStockCount: number;
  recentSales: Array<{
    _id: string;
    customerName: string;
    totalAmount: number;
    itemsCount: number;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    _id: string;
    name: string;
    category: string;
    metal: string;
    quantity: number;
    lowStockThreshold: number;
  }>;
}

export interface ReportData {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalSalesCount: number;
  totalExpenses: number;
  netProfit: number;
  salesTrend: Array<{
    date: string;
    revenue: number;
    salesCount: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
  categorySalesDistribution: Array<{
    category: string;
    totalRevenue: number;
  }>;
}

function getPeriodRange(period: DashboardPeriod): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const monthName = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
      return { start, end, label: monthName };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end, label: `Year ${now.getFullYear()}` };
    }
    case "today":
    default: {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { start, end, label: "Today" };
    }
  }
}

export async function getDashboardMetrics(
  period: DashboardPeriod = "today"
): Promise<ActionResult<DashboardMetrics>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    const { start, end, label } = getPeriodRange(period);

    // Mongoose aggregations for period totals scoped by tenantId
    const [periodSalesAgg, periodExpensesAgg, totalProductsCount, lowStockProducts, recentSales] =
      await Promise.all([
        Sale.aggregate([
          { $match: { userId: tenantId, createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalAmount" },
              count: { $sum: 1 },
            },
          },
        ]),
        Expense.aggregate([
          { $match: { userId: tenantId, date: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              totalAmount: {
                $sum: {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ["$items", []] } }, 0] },
                    "$totalAmount",
                    { $ifNull: ["$amount", 0] },
                  ],
                },
              },
            },
          },
        ]),
        Product.countDocuments({ userId: tenantId }),
        Product.find({ userId: tenantId, $expr: { $lte: ["$quantity", "$lowStockThreshold"] } })
          .select("name category metal quantity lowStockThreshold")
          .limit(10)
          .lean(),
        Sale.find({ userId: tenantId })
          .sort({ createdAt: -1 })
          .limit(8)
          .select("customerName totalAmount items createdAt")
          .lean(),
      ]);

    const periodSalesTotal = periodSalesAgg[0]?.totalAmount || 0;
    const periodSalesCount = periodSalesAgg[0]?.count || 0;
    const periodExpensesTotal = periodExpensesAgg[0]?.totalAmount || 0;

    const formattedRecentSales = recentSales.map((s: any) => ({
      _id: s._id.toString(),
      customerName: s.customerName,
      totalAmount: s.totalAmount,
      itemsCount: s.items?.length || 0,
      createdAt: new Date(s.createdAt).toISOString(),
    }));

    const formattedLowStock = lowStockProducts.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      category: p.category,
      metal: p.metal,
      quantity: p.quantity,
      lowStockThreshold: p.lowStockThreshold,
    }));

    return {
      success: true,
      data: {
        periodLabel: label,
        periodSalesTotal,
        periodSalesCount,
        periodExpensesTotal,
        totalProductsCount,
        lowStockCount: formattedLowStock.length,
        recentSales: formattedRecentSales,
        lowStockProducts: formattedLowStock,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return { success: false, error: "Failed to load dashboard metrics" };
  }
}

export async function getReportData(
  startDateStr?: string,
  endDateStr?: string
): Promise<ActionResult<ReportData>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    // Default to last 30 days if no range provided
    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(now.getDate() - 30);
    defaultStart.setHours(0, 0, 0, 0);

    const startDate = startDateStr ? new Date(startDateStr) : defaultStart;
    const endDate = endDateStr ? new Date(endDateStr) : now;
    endDate.setHours(23, 59, 59, 999);

    // Mongoose Aggregation 1: Sales Summary & Daily Trend Pipeline scoped by tenantId
    const salesTrendAgg = await Sale.aggregate([
      { $match: { userId: tenantId, createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Mongoose Aggregation 2: Category Breakdown from embedded sale items scoped by tenantId
    const categorySalesAgg = await Sale.aggregate([
      { $match: { userId: tenantId, createdAt: { $gte: startDate, $lte: endDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalRevenue: { $sum: "$items.lineTotal" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    // Mongoose Aggregation 3: Expenses By Category Pipeline scoped by tenantId
    const expensesAgg = await Expense.aggregate([
      { $match: { userId: tenantId, date: { $gte: startDate, $lte: endDate } } },
      {
        $facet: {
          itemsCategories: [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.category",
                amount: { $sum: "$items.amount" },
              },
            },
          ],
          legacyCategories: [
            { $match: { category: { $exists: true, $ne: null } } },
            {
              $group: {
                _id: "$category",
                amount: { $sum: "$amount" },
              },
            },
          ],
        },
      },
    ]);

    const combinedMap: Record<string, number> = {};
    if (expensesAgg[0]) {
      (expensesAgg[0].itemsCategories || []).forEach((c: any) => {
        combinedMap[c._id] = (combinedMap[c._id] || 0) + c.amount;
      });
      (expensesAgg[0].legacyCategories || []).forEach((c: any) => {
        combinedMap[c._id] = (combinedMap[c._id] || 0) + c.amount;
      });
    }

    let totalRevenue = 0;
    let totalSalesCount = 0;
    const salesTrend = salesTrendAgg.map((item) => {
      totalRevenue += item.revenue;
      totalSalesCount += item.salesCount;
      return {
        date: item._id,
        revenue: item.revenue,
        salesCount: item.salesCount,
      };
    });

    let totalExpenses = 0;
    const expensesByCategory = Object.entries(combinedMap).map(([cat, amt]) => {
      totalExpenses += amt;
      return {
        category: cat,
        amount: amt,
      };
    }).sort((a, b) => b.amount - a.amount);

    const categorySalesDistribution = categorySalesAgg.map((item) => ({
      category: item._id,
      totalRevenue: item.totalRevenue,
    }));

    const netProfit = totalRevenue - totalExpenses;

    return {
      success: true,
      data: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalRevenue,
        totalSalesCount,
        totalExpenses,
        netProfit,
        salesTrend,
        expensesByCategory,
        categorySalesDistribution,
      },
    };
  } catch (error) {
    console.error("Error in getReportData aggregation:", error);
    return { success: false, error: "Failed to generate report analytics" };
  }
}
