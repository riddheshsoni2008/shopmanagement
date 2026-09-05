import { getOrders } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { OrdersList } from "@/components/orders/orders-list";

export const revalidate = 0;

export default async function ClothingOrdersPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role || "staff";
  const res = await getOrders("clothing", { limit: 200 });
  const orders = res.success ? res.data.orders : [];
  return <OrdersList category="clothing" initialOrders={orders} userRole={userRole} />;
}
