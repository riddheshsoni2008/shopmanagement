import { getOrderDashboardMetrics } from "@/actions/orders";
import { OrderDashboard } from "@/components/orders/order-dashboard";

export const revalidate = 0;

export default async function StudioDashboardPage() {
  const res = await getOrderDashboardMetrics("studio");
  const metrics = res.success
    ? res.data
    : { totalRevenue: 0, totalExpenses: 0, totalProfit: 0, totalOrders: 0, pendingOrders: 0, completedOrders: 0, recentOrders: [] };

  return <OrderDashboard category="studio" metrics={metrics} />;
}
