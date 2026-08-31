import { getSales } from "@/actions/sales";
import { getRateSettings } from "@/actions/settings";
import { SalesTable } from "@/components/sales/sales-table";
import { Receipt } from "lucide-react";

export const revalidate = 0; // SSR live rendering

export default async function SalesHistoryPage() {
  const [salesRes, ratesRes] = await Promise.all([
    getSales({ limit: 500 }),
    getRateSettings(),
  ]);

  const initialData = salesRes.success
    ? salesRes.data
    : { sales: [], total: 0, page: 1, totalPages: 1 };
  const shopName = ratesRes.success ? ratesRes.data.shopName : "Aura Luxury Jewelers";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold font-serif text-amber-400 sm:text-3xl flex items-center gap-2">
          <Receipt className="h-7 w-7 text-amber-400" /> Sales Transaction History
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Search past customer bills, filter by date range, and print or download official tax invoices.
        </p>
      </div>

      <SalesTable initialData={initialData} shopName={shopName} />
    </div>
  );
}
