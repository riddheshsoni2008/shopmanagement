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
import { TrendingUp, Store, User as UserIcon, Loader2, Save } from "lucide-react";
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

  const onSubmit = async (values: RateInput) => {
    setIsSubmitting(true);
    try {
      const res = await updateRateSettings(values);
      if (res.success) {
        toast.success("Live rates & shop settings updated successfully!");
        window.location.reload();
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
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-400" /> Daily Live Metal Rates (Per Gram)
            </CardTitle>
            <CardDescription>
              Set the benchmark gold and silver rates used for automatic billing calculations shop-wide.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Gold 22K Rate */}
              <div>
                <label className="block text-xs font-semibold text-amber-400">
                  Gold Rate (22K) / Gram (₹) *
                </label>
                <div className="mt-1 relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("goldRate22k")}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.goldRate22k && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.goldRate22k.message}
                  </p>
                )}
              </div>

              {/* Gold 18K Rate */}
              <div>
                <label className="block text-xs font-semibold text-amber-400">
                  Gold Rate (18K) / Gram (₹) *
                </label>
                <div className="mt-1 relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("goldRate18k")}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.goldRate18k && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.goldRate18k.message}
                  </p>
                )}
              </div>

              {/* Silver Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Fine Silver Rate / Gram (₹) *
                </label>
                <div className="mt-1 relative">
                  <Input
                    type="number"
                    step="0.01"
                    {...register("silverRate")}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.silverRate && (
                  <p className="mt-1 text-xs text-rose-400 font-medium">
                    {errors.silverRate.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Branding & Owner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-amber-400" /> Store Branding & Admin Account Details
            </CardTitle>
            <CardDescription>
              Legal shop name and admin profile name displayed across the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Official Shop Business Name *
                </label>
                <Input
                  placeholder="Zeal Jewellers"
                  {...register("shopName")}
                  disabled={isSubmitting}
                />
                {errors.shopName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.shopName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Admin / Owner Account Name
                </label>
                <Input
                  placeholder="Aura Admin"
                  {...register("ownerName")}
                  disabled={isSubmitting}
                />
                {errors.ownerName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.ownerName.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800">
              <span suppressHydrationWarning>
                Last Updated: <strong className="text-slate-200" suppressHydrationWarning>{formatDateTime(initialRates.updatedAt)}</strong>
              </span>
              {initialRates.updatedBy && (
                <span>
                  By: <strong className="text-slate-200">{initialRates.updatedBy.name}</strong>
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 px-8 font-bold text-base shadow-xl shadow-amber-500/20"
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
