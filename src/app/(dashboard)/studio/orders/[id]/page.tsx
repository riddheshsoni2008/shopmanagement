import { getOrderById } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/order-detail";

export const revalidate = 0;

interface Props { params: Promise<{ id: string }> }

export default async function StudioOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userRole = (session?.user as any)?.role || "staff";
  const res = await getOrderById(id);
  if (!res.success || !res.data) notFound();
  return <OrderDetailView order={res.data} category="studio" userRole={userRole} />;
}
