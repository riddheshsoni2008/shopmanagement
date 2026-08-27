import { getProducts } from "@/actions/stock";
import { auth } from "@/lib/auth";
import { ProductTable } from "@/components/stock/product-table";
import { Gem } from "lucide-react";

export const revalidate = 0; // SSR live rendering

export default async function StockPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role || "staff";

  const result = await getProducts({ limit: 100 });
  const initialData = result.success
    ? result.data
    : { products: [], total: 0, page: 1, totalPages: 1 };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold font-serif text-amber-400 sm:text-3xl flex items-center gap-2">
          <Gem className="h-7 w-7 text-amber-400" /> Jewelry Inventory Catalog
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Track live jewelry stock levels, metals, purity, threshold alerts, and pricing.
        </p>
      </div>

      <ProductTable initialData={initialData} userRole={userRole} />
    </div>
  );
}
