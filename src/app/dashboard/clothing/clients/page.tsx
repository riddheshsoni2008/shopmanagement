import { getClients } from "@/actions/clients";
import { ClientsList } from "@/components/clients/clients-list";

export const revalidate = 0;

export default async function ClothingClientsPage() {
  const res = await getClients("clothing");
  const clients = res.success && res.data ? res.data.clients : [];
  const total = res.success && res.data ? res.data.total : 0;

  return <ClientsList category="clothing" initialClients={clients} initialTotal={total} />;
}

