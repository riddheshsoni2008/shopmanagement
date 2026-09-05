import { getOrderReportData } from "@/actions/orders";
import { OrderReports } from "@/components/orders/order-reports";

export const revalidate = 0;

export default async function StudioReportsPage() {
  const res = await getOrderReportData("studio");

  const initialData =
    res.success && res.data
      ? res.data
      : {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          totalOrders: 0,
          ordersByStatus: [],
          ordersByType: [],
          expensesByCategory: [],
          revenueTrend: [],
        };

  return <OrderReports category="studio" initialData={initialData} />;
}

