import { getOrderDashboardMetrics } from "@/actions/orders";
import { OrderDashboard } from "@/components/orders/order-dashboard";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ period?: string; status?: string; startDate?: string; endDate?: string }>;
}

export default async function StudioDashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const res = await getOrderDashboardMetrics("studio", {
    period: (params.period as any) || "month",
    status: params.status,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const metrics = res.success && res.data
    ? res.data
    : {
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        recentOrders: [],
        period: params.period || "month",
        status: params.status || "all",
      };

  return <OrderDashboard category="studio" metrics={metrics} />;
}
