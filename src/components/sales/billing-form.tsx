"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saleSchema, SaleInput } from "@/lib/validators/sale";
import { createSale } from "@/actions/sales";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { InvoiceModal } from "@/components/sales/invoice-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Loader2,
  Calculator,
  User,
  Phone,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface BillingFormProps {
  products: Array<{
    _id: string;
    name: string;
    category: string;
    metal: string;
    purity: string;
    weightPerPiece: number;
    quantity: number;
    sellingPrice: number;
  }>;
  rates: {
    goldRate22k: number;
    goldRate18k: number;
    silverRate: number;
    shopName: string;
  };
}

export function BillingForm({ products, rates }: BillingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SaleInput>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      discount: 0,
      items: [
        {
          productId: "",
          name: "",
          qty: 1,
          weight: 10,
          pricePerGram: rates.goldRate22k,
          makingCharge: 150,
          hallmarkCharge: 0,
          jadatarCharge: 0,
          rhodiumCharge: 0,
          nangCharge: 0,
          lineTotal: 10 * (rates.goldRate22k + 150),
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchDiscount = watch("discount") || 0;

  // Quick rate preset filler function
  const applyRatePreset = (index: number, rate: number) => {
    setValue(`items.${index}.pricePerGram`, rate);
    const item = watchItems[index];
    if (!item) return;
    const q = Math.max(1, Number(item.qty) || 1);
    const w = Math.max(0, Number(item.weight) || 0);
    const m = Math.max(0, Number(item.makingCharge) || 0);
    const h = Math.max(0, Number(item.hallmarkCharge) || 0);
    const j = Math.max(0, Number(item.jadatarCharge) || 0);
    const r = Math.max(0, Number(item.rhodiumCharge) || 0);
    const n = Math.max(0, Number(item.nangCharge) || 0);
    const total = q * (w * (rate + m) + h + j + r + n);
    setValue(`items.${index}.lineTotal`, Math.max(0, total));
  };

  // Auto-fill price per gram based on selected product and current stored rates
  const handleProductSelect = (index: number, selectedId: string) => {
    const selectedProduct = products.find((p) => p._id === selectedId);
    if (!selectedProduct) return;

    const metalLower = (selectedProduct.metal || "").toLowerCase();
    const purityLower = (selectedProduct.purity || "").toLowerCase();

    let ratePerGram = rates.goldRate22k;

    if (metalLower.includes("silver") || selectedProduct.category === "Payal") {
      ratePerGram = rates.silverRate;
    } else if (metalLower.includes("gold")) {
      if (purityLower.includes("18")) {
        ratePerGram = rates.goldRate18k;
      } else {
        ratePerGram = rates.goldRate22k;
      }
    } else if (selectedProduct.sellingPrice > 0 && selectedProduct.weightPerPiece > 0) {
      ratePerGram = selectedProduct.sellingPrice / selectedProduct.weightPerPiece;
    }

    const qty = 1;
    const weight = selectedProduct.weightPerPiece || 1;
    const making = 120; // default ₹120 per gram making charge
    const hallmark = watchItems[index]?.hallmarkCharge || 0;
    const jadatar = watchItems[index]?.jadatarCharge || 0;
    const rhodium = watchItems[index]?.rhodiumCharge || 0;
    const nang = watchItems[index]?.nangCharge || 0;
    const lineTotal = qty * (weight * (ratePerGram + making) + hallmark + jadatar + rhodium + nang);

    setValue(`items.${index}.productId`, selectedProduct._id);
    setValue(`items.${index}.name`, selectedProduct.name);
    setValue(`items.${index}.qty`, qty);
    setValue(`items.${index}.weight`, weight);
    setValue(`items.${index}.pricePerGram`, ratePerGram);
    setValue(`items.${index}.makingCharge`, making);
    setValue(`items.${index}.lineTotal`, lineTotal);
  };
  const updateLineTotal = (index: number) => {
    const item = watchItems[index];
    if (!item) return;
    const q = Math.max(1, Number(item.qty) || 1);
    const w = Math.max(0, Number(item.weight) || 0);
    const p = Math.max(0, Number(item.pricePerGram) || 0);
    const m = Math.max(0, Number(item.makingCharge) || 0);
    const h = Math.max(0, Number(item.hallmarkCharge) || 0);
    const j = Math.max(0, Number(item.jadatarCharge) || 0);
    const r = Math.max(0, Number(item.rhodiumCharge) || 0);
    const n = Math.max(0, Number(item.nangCharge) || 0);
    const total = q * (w * (p + m) + h + j + r + n);
    setValue(`items.${index}.lineTotal`, Math.max(0, total));
  };

  // Compute live subtotal & grand total
  let subtotal = 0;
  watchItems.forEach((item) => {
    subtotal += Number(item.lineTotal) || 0;
  });
  const grandTotal = Math.max(0, subtotal - (Number(watchDiscount) || 0));

  const onSubmit = async (values: SaleInput) => {
    setIsSubmitting(true);
    try {
      const res = await createSale(values);
      if (res.success) {
        toast.success("Sale bill submitted successfully!");
        
        // Format object for instant invoice modal display
        setCompletedSale({
          _id: res.data,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          items: values.items,
          discount: values.discount,
          totalAmount: grandTotal,
          createdAt: new Date().toISOString(),
        });
        setInvoiceModalOpen(true);

        reset({
          customerName: "",
          customerPhone: "",
          discount: 0,
          items: [],
        });
        router.refresh();
      } else {
        toast.error(res.error || "Failed to process sale transaction");
      }
    } catch (err) {
      toast.error("An error occurred while creating sale bill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Customer & Item Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-400" /> Customer Information
                </CardTitle>
                <CardDescription>Enter billing contact details</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Customer Full Name *
                  </label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      placeholder="e.g. Rajesh Sharma"
                      className="pl-9"
                      {...register("customerName")}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-rose-400">
                      {errors.customerName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Mobile Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      placeholder="9876543210"
                      className="pl-9"
                      {...register("customerPhone")}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="mt-1 text-xs text-rose-400">
                      {errors.customerPhone.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Payment Status *
                    </label>
                    <select
                      className="mt-1 flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      {...register("paymentStatus")}
                      disabled={isSubmitting}
                    >
                      <option value="PAID">PAID</option>
                      <option value="PENDING">PENDING</option>
                      <option value="PARTIAL">PARTIAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Payment Method *
                    </label>
                    <select
                      className="mt-1 flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      {...register("paymentMethod")}
                      disabled={isSubmitting}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / GPay">UPI / GPay</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bill Items Selection List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-amber-400" /> Sale Bill Items
                  </CardTitle>
                  <CardDescription>Select products from stock & customize pricing</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    append({
                      productId: "",
                      name: "",
                      qty: 1,
                      weight: 5,
                      pricePerGram: rates.goldRate22k,
                      makingCharge: 100,
                      hallmarkCharge: 0,
                      jadatarCharge: 0,
                      rhodiumCharge: 0,
                      nangCharge: 0,
                      lineTotal: 5 * (rates.goldRate22k + 100),
                    })
                  }
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Another Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <p className="text-center py-6 text-sm text-slate-400">
                    No items added yet. Click &quot;Add Another Item&quot; to pick products.
                  </p>
                ) : (
                  fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">
                          Item #{index + 1}
                        </span>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Select Product */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300">
                            Select Inventory Product *
                          </label>
                          <Select
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            disabled={isSubmitting}
                          >
                            <option value="">-- Choose Stock Item --</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id} disabled={p.quantity <= 0}>
                                {p.name} ({p.metal} {p.purity} • {p.quantity} in stock)
                              </option>
                            ))}
                          </Select>
                        </div>

                        {/* Custom Item Name */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300">
                            Line Item Name *
                          </label>
                          <Input
                            placeholder="Product name"
                            {...register(`items.${index}.name`)}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Qty */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400">
                            Qty *
                          </label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            {...register(`items.${index}.qty`, {
                              valueAsNumber: true,
                              onChange: () => updateLineTotal(index),
                            })}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Weight */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400">
                            Weight (g) *
                          </label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            {...register(`items.${index}.weight`, {
                              valueAsNumber: true,
                              onChange: () => updateLineTotal(index),
                            })}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Rate per gram */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-slate-400">
                              Rate / Gram (₹) *
                            </label>
                            <div className="flex gap-1 text-[9px]">
                              <button
                                type="button"
                                title={`Auto-fill 22K Gold Rate (${formatCurrency(rates.goldRate22k)}/g)`}
                                onClick={() => applyRatePreset(index, rates.goldRate22k)}
                                className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 transition-colors font-medium"
                              >
                                22K
                              </button>
                              <button
                                type="button"
                                title={`Auto-fill 18K Gold Rate (${formatCurrency(rates.goldRate18k)}/g)`}
                                onClick={() => applyRatePreset(index, rates.goldRate18k)}
                                className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 transition-colors font-medium"
                              >
                                18K
                              </button>
                              <button
                                type="button"
                                title={`Auto-fill Silver Rate (${formatCurrency(rates.silverRate)}/g)`}
                                onClick={() => applyRatePreset(index, rates.silverRate)}
                                className="px-1 py-0.5 rounded bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors font-medium"
                              >
                                Silver
                              </button>
                            </div>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register(`items.${index}.pricePerGram`, {
                              valueAsNumber: true,
                              onChange: () => updateLineTotal(index),
                            })}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Making Charge per gram */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-slate-400">
                              Making / g (₹) *
                            </label>
                            <span className="text-[10px] text-amber-400 font-mono font-bold">
                              Total: {formatCurrency((watchItems[index]?.qty || 1) * (watchItems[index]?.weight || 0) * (watchItems[index]?.makingCharge || 0))}
                            </span>
                          </div>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 100"
                            {...register(`items.${index}.makingCharge`, {
                              valueAsNumber: true,
                              onChange: () => updateLineTotal(index),
                            })}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {/* Extra Customization Charges Row */}
                      <div className="border-t border-slate-800/80 pt-3">
                        <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider block mb-2">
                          Extra Charges (Hallmark, Jadatar, Rodium, Nang)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Hallmark */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400">
                              Hall Mark (₹)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              {...register(`items.${index}.hallmarkCharge`, {
                                valueAsNumber: true,
                                onChange: () => updateLineTotal(index),
                              })}
                              disabled={isSubmitting}
                            />
                          </div>

                          {/* Jadatar */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400">
                              Jadatar (₹)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              {...register(`items.${index}.jadatarCharge`, {
                                valueAsNumber: true,
                                onChange: () => updateLineTotal(index),
                              })}
                              disabled={isSubmitting}
                            />
                          </div>

                          {/* Rodium */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400">
                              Rodium (₹)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              {...register(`items.${index}.rhodiumCharge`, {
                                valueAsNumber: true,
                                onChange: () => updateLineTotal(index),
                              })}
                              disabled={isSubmitting}
                            />
                          </div>

                          {/* Nang */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400">
                              Nang / Stone (₹)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              {...register(`items.${index}.nangCharge`, {
                                valueAsNumber: true,
                                onChange: () => updateLineTotal(index),
                              })}
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Line Total:</span>
                          <strong className="text-sm font-bold text-amber-400 font-serif">
                            {formatCurrency(watchItems[index]?.lineTotal || 0)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {errors.items && (
                  <p className="text-xs text-rose-400">{errors.items.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Checkout Summary Box */}
          <div className="space-y-6">
            <Card className="border-amber-500/40 bg-slate-900/95 sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-amber-400" /> Bill Summary
                </CardTitle>
                <CardDescription>Total settlement calculation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 border-b border-slate-800 pb-4 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal:</span>
                    <span className="font-mono text-slate-200">{formatCurrency(subtotal)}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Flat Discount Amount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      {...register("discount")}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30">
                  <span className="text-xs text-amber-400 font-semibold block">
                    GRAND TOTAL PAYABLE
                  </span>
                  <div className="text-3xl font-bold font-serif text-amber-300 mt-1">
                    {formatCurrency(grandTotal)}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || fields.length === 0}
                  className="w-full h-12 text-base font-bold shadow-xl shadow-amber-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Sale...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="mr-2 h-5 w-5" /> Generate Official Bill
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        sale={completedSale}
        shopName={rates.shopName}
      />
    </div>
  );
}
