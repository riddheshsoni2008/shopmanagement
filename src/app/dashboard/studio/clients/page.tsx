import { getClients } from "@/actions/clients";
import { ClientsList } from "@/components/clients/clients-list";

export const revalidate = 0;

export default async function StudioClientsPage() {
  const res = await getClients("studio");
  const clients = res.success && res.data ? res.data.clients : [];
  const total = res.success && res.data ? res.data.total : 0;

  return <ClientsList category="studio" initialClients={clients} initialTotal={total} />;
}

