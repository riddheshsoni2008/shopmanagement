import { getClientById } from "@/actions/clients";
import { notFound } from "next/navigation";
import { ClientDetailView } from "@/components/clients/client-detail";

export const revalidate = 0;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClothingClientDetailPage({ params }: Props) {
  const { id } = await params;
  const res = await getClientById(id);
  if (!res.success || !res.data) notFound();

  return <ClientDetailView client={res.data} category="clothing" />;
}

