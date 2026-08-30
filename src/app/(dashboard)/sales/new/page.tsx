import { getProducts } from "@/actions/stock";
import { getRateSettings } from "@/actions/settings";
import { BillingForm } from "@/components/sales/billing-form";
import { ShoppingCart } from "lucide-react";

export const revalidate = 0; // SSR live rendering shell

export default async function NewSalePage() {
  const [productsRes, ratesRes] = await Promise.all([
    getProducts({ limit: 200 }),
    getRateSettings(),
  ]);

  const products = (productsRes.success && productsRes.data?.products) ? productsRes.data.products : [];
  const rates = (ratesRes.success && ratesRes.data)
    ? ratesRes.data
    : {
        goldRate22k: 7200,
        goldRate18k: 5900,
        silverRate: 85,
        shopName: "Zeal Jewellers",
      };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold font-serif text-amber-400 sm:text-3xl flex items-center gap-2">
          <ShoppingCart className="h-7 w-7 text-amber-400" /> New Jewelry Sale Billing
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Create customer tax invoice, select items, auto-calculate metal rates x weight, and update stock.
        </p>
      </div>

      <BillingForm products={products} rates={rates} />
    </div>
  );
}
