import { getProductById } from "@/actions/stock";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Gem, ShieldAlert, Tag, Scale, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0; // SSR live single-item data

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";

  const res = await getProductById(id);
  if (!res.success || !res.data) {
    notFound();
  }

  const product = res.data;
  const isLowStock = product.quantity <= product.lowStockThreshold;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/stock">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-serif text-amber-400 sm:text-3xl flex items-center gap-2">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Item ID: <span className="font-mono text-xs text-slate-300">{product._id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={product.metal === "Gold" ? "gold" : product.metal === "Silver" ? "silver" : "platinum"} className="text-sm px-3 py-1">
            {product.metal} • {product.purity}
          </Badge>
          <Badge variant={isLowStock ? "lowStock" : "inStock"} className="text-sm px-3 py-1">
            {product.quantity} In Stock
          </Badge>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Specifications */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-amber-400" /> Item Specifications & Stock Status
            </CardTitle>
            <CardDescription>Comprehensive physical parameters and threshold triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Category
                </span>
                <p className="text-base font-semibold text-slate-200">{product.category}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5" /> Weight / Piece
                </span>
                <p className="text-base font-mono font-semibold text-slate-200">
                  {product.weightPerPiece} grams
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Size / Length</span>
                <p className="text-base font-semibold text-slate-200">
                  {product.size || "Standard"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Low Stock Min</span>
                <p className="text-base font-semibold text-slate-200">
                  {product.lowStockThreshold} units
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Date Added
                </span>
                <p className="text-sm font-semibold text-slate-200" suppressHydrationWarning>
                  {formatDateTime(product.createdAt)}
                </p>
              </div>
            </div>

            {isLowStock && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Low Inventory Warning</h4>
                  <p className="text-xs text-rose-200 mt-1">
                    Current stock ({product.quantity}) is at or below minimum threshold ({product.lowStockThreshold}). Please order additional pieces from supplier.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-400" /> Pricing & Valuation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/20">
              <span className="text-xs text-amber-400 font-medium">Selling Price per Unit</span>
              <p className="text-3xl font-bold font-serif text-amber-300 mt-1">
                {formatCurrency(product.sellingPrice)}
              </p>
            </div>

            {isAdmin && (
              <div className="rounded-xl bg-slate-800/80 p-4 border border-slate-700">
                <span className="text-xs text-slate-400">Cost / Purchase Price</span>
                <p className="text-xl font-bold text-slate-200 mt-1">
                  {formatCurrency(product.purchasePrice)}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-700/80 flex justify-between text-xs text-slate-400">
                  <span>Gross Profit Margin:</span>
                  <strong className="text-emerald-400">
                    {formatCurrency(product.sellingPrice - product.purchasePrice)}
                  </strong>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Link href={`/sales/new`}>
                <Button className="w-full font-bold">
                  Create Sale Bill For Item
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
