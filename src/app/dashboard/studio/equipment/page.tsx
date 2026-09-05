import { getEquipment } from "@/actions/equipment";
import { EquipmentList } from "@/components/equipment/equipment-list";

export const revalidate = 0;

export default async function StudioEquipmentPage() {
  const res = await getEquipment();
  const items = res.success && res.data ? res.data : [];
  const serviceDueCount = items.filter((item) => item.isServiceDueSoon).length;

  return <EquipmentList initialEquipment={items} initialServiceDueCount={serviceDueCount} />;
}

