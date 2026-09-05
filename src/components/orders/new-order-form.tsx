"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/actions/orders";
import { CATEGORY_CONFIGS } from "@/lib/category-config";
import type { BusinessCategory } from "@/lib/category-config";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface NewOrderFormProps {
  category: "studio" | "clothing";
}

export function NewOrderForm({ category }: NewOrderFormProps) {
  const cfg = CATEGORY_CONFIGS[category];
  const base = `/dashboard/${category}`;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isStudio = category === "studio";

  const accentText = isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400";
  const accentBtn = isStudio
    ? "bg-violet-600 hover:bg-violet-700"
    : "bg-rose-600 hover:bg-rose-700";

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    orderType: cfg.orderTypes[0] || "",
    orderDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    agreedAmount: "",
    advanceReceived: "",
    description: "",
    photographerName: "",
    venueAddress: "",
    measurementNotes: "",
    fabricDetails: "",
  });

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.clientPhone.trim()) {
      toast.error("Client name and phone are required");
      return;
    }
    if (!form.orderType) {
      toast.error("Please select an order type");
      return;
    }
    const agreedAmount = parseFloat(form.agreedAmount);
    if (isNaN(agreedAmount) || agreedAmount < 0) {
      toast.error("Enter a valid agreed amount");
      return;
    }
    const advanceReceived = parseFloat(form.advanceReceived) || 0;
    if (advanceReceived > agreedAmount) {
      toast.error("Advance received cannot exceed agreed amount");
      return;
    }

    startTransition(async () => {
      const res = await createOrder({
        businessCategory: category,
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        orderType: form.orderType,
        orderDate: form.orderDate,
        dueDate: form.dueDate || undefined,
        agreedAmount,
        advanceReceived,
        description: form.description,
        photographerName: form.photographerName,
        venueAddress: form.venueAddress,
        measurementNotes: form.measurementNotes,
        fabricDetails: form.fabricDetails,
      });

      if (res.success) {
        toast.success(`Order ${res.data.orderNumber} created!`);
        router.push(`${base}/orders/${res.data.orderId}`);
      } else {
        toast.error(res.error || "Failed to create order");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <Link href={`${base}/orders`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className={`text-xl font-bold font-serif ${accentText}`}>New Order</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{cfg.label}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Client Name *
                </label>
                <Input
                  value={form.clientName}
                  onChange={(e) => set("clientName", e.target.value)}
                  placeholder="Full name"
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Phone Number *
                </label>
                <Input
                  value={form.clientPhone}
                  onChange={(e) => set("clientPhone", e.target.value)}
                  placeholder="10-digit number"
                  required
                  disabled={isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Order Type *
                </label>
                <select
                  value={form.orderType}
                  onChange={(e) => set("orderType", e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {cfg.orderTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Order Date *
                </label>
                <Input
                  type="date"
                  value={form.orderDate}
                  onChange={(e) => set("orderDate", e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Due / Delivery Date
                </label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Description / Notes
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Order details, special requirements..."
                rows={3}
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Financials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Agreed Amount (₹) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.agreedAmount}
                  onChange={(e) => set("agreedAmount", e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Advance Received (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.advanceReceived}
                  onChange={(e) => set("advanceReceived", e.target.value)}
                  placeholder="0.00"
                  disabled={isPending}
                />
              </div>
            </div>
            {form.agreedAmount && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Balance due after advance:</span>
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                    ₹{Math.max(0, (parseFloat(form.agreedAmount) || 0) - (parseFloat(form.advanceReceived) || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category-specific extras */}
        {isStudio && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Studio Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Photographer / Staff Name
                  </label>
                  <Input
                    value={form.photographerName}
                    onChange={(e) => set("photographerName", e.target.value)}
                    placeholder="Assigned photographer"
                    disabled={isPending}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Venue / Location
                  </label>
                  <Input
                    value={form.venueAddress}
                    onChange={(e) => set("venueAddress", e.target.value)}
                    placeholder="Shoot location"
                    disabled={isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isStudio && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Garment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Measurement Notes
                </label>
                <textarea
                  value={form.measurementNotes}
                  onChange={(e) => set("measurementNotes", e.target.value)}
                  placeholder="Bust, waist, hip, length, sleeve measurements..."
                  rows={3}
                  disabled={isPending}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Fabric Details
                </label>
                <Input
                  value={form.fabricDetails}
                  onChange={(e) => set("fabricDetails", e.target.value)}
                  placeholder="Fabric type, color, quantity..."
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className={`flex-1 h-11 font-bold text-sm uppercase tracking-wide text-white ${accentBtn}`}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Order...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Create Order</>
            )}
          </Button>
          <Link href={`${base}/orders`}>
            <Button variant="outline" disabled={isPending} className="h-11">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
