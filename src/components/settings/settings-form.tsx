"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rateSchema, RateInput } from "@/lib/validators/rate";
import { updateRateSettings, RateSettingsData } from "@/actions/settings";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Store, User as UserIcon, Loader2, Save, Scale, Calculator } from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  initialRates: RateSettingsData;
  currentUser?: {
    name?: string | null;
    email?: string | null;
    role?: "admin" | "staff";
  };
}

export function SettingsForm({ initialRates, currentUser }: SettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RateInput>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      goldRate22k: initialRates.goldRate22k,
      goldRate18k: initialRates.goldRate18k,
      silverRate: initialRates.silverRate,
      shopName: initialRates.shopName,
      ownerName: currentUser?.name || "",
    },
  });

  // Watch live values for auto-calculation
  const gold22k = watch("goldRate22k");
  const gold18k = watch("goldRate18k");
  const silver = watch("silverRate");

  // Computed rates
  const gold22k10g = (Number(gold22k) || 0) * 10;
  const gold18k10g = (Number(gold18k) || 0) * 10;
  const silver1kg = (Number(silver) || 0) * 1000;

  const formatINR = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const onSubmit = async (values: RateInput) => {
    setIsSubmitting(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("zeal_rate_settings", JSON.stringify(values));
      }
      const res = await updateRateSettings(values);
      if (res.success) {
        toast.success("Live rates & shop settings updated successfully!");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to update settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Metal Rates Card */}
        <Card className="border-amber-300 dark:border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" /> Daily Live Metal Rates (Per Gram)
            </CardTitle>
            <CardDescription>
              Set the benchmark gold and silver rates used for automatic billing calculations shop-wide.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gold Rates Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gold 22K Rate */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Gold Rate (22K) / Gram (₹) *
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("goldRate22k")}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.goldRate22k && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                    {errors.goldRate22k.message}
                  </p>
                )}
                {/* Auto-calculated 10g rate */}
                <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-400/80 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="h-3 w-3" /> 10 Gram Rate
                    </span>
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                      {formatINR(gold22k10g)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gold 18K Rate */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Gold Rate (18K) / Gram (₹) *
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("goldRate18k")}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.goldRate18k && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                    {errors.goldRate18k.message}
                  </p>
                )}
                {/* Auto-calculated 10g rate */}
                <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-400/80 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="h-3 w-3" /> 10 Gram Rate
                    </span>
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                      {formatINR(gold18k10g)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Silver Rate */}
            <div className="space-y-2 max-w-sm">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Fine Silver Rate / Gram (₹) *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  {...register("silverRate")}
                  disabled={isSubmitting}
                />
              </div>
              {errors.silverRate && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                  {errors.silverRate.message}
                </p>
              )}
              {/* Auto-calculated 1kg rate */}
              <div className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="h-3 w-3" /> 1 KG Rate (1000g)
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-200 tabular-nums">
                    {formatINR(silver1kg)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Branding & Owner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Store className="h-5 w-5 text-amber-600 dark:text-amber-400" /> Store Branding & Admin Account Details
            </CardTitle>
            <CardDescription>
              Legal shop name and admin profile name displayed across the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Shop Business Name *
                </label>
                <Input
                  placeholder="Zeal Jewellers"
                  {...register("shopName")}
                  disabled={isSubmitting}
                />
                {errors.shopName && (
                  <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.shopName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Admin / Owner Account Name
                </label>
                <Input
                  placeholder="Aura Admin"
                  {...register("ownerName")}
                  disabled={isSubmitting}
                />
                {errors.ownerName && (
                  <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.ownerName.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-amber-100 dark:border-slate-800">
              <span suppressHydrationWarning>
                Last Updated: <strong className="text-slate-900 dark:text-slate-200" suppressHydrationWarning>{formatDateTime(initialRates.updatedAt)}</strong>
              </span>
              {initialRates.updatedBy && (
                <span>
                  By: <strong className="text-slate-900 dark:text-slate-200">{initialRates.updatedBy.name}</strong>
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 px-8 font-bold text-base shadow-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Settings...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" /> Update Live Rates & Settings
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
