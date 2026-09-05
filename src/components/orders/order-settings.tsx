"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORY_CONFIGS } from "@/lib/category-config";
import type { BusinessCategory } from "@/lib/category-config";
import { updateShopProfile, ShopProfileData } from "@/actions/settings";
import {
  Settings,
  Store,
  User as UserIcon,
  Mail,
  ArrowRightLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  Camera,
  Scissors,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface OrderSettingsProps {
  category: "studio" | "clothing";
  profile: ShopProfileData;
}

export function OrderSettings({ category, profile }: OrderSettingsProps) {
  const router = useRouter();
  const [shopName, setShopName] = useState(profile.shopName || "");
  const [ownerName, setOwnerName] = useState(profile.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const cfg = CATEGORY_CONFIGS[category];
  const isStudio = category === "studio";

  const brandText = isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400";
  const brandBg = isStudio ? "bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  const brandBorder = isStudio ? "border-violet-300 dark:border-violet-500/30" : "border-rose-300 dark:border-rose-500/30";
  const Icon = isStudio ? Camera : Scissors;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error("Business name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateShopProfile({
        shopName: shopName.trim(),
        name: ownerName.trim(),
      });

      if (res.success) {
        toast.success("Business profile saved successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save settings");
      }
    } catch {
      toast.error("An unexpected error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${brandBg}`}>
            <Settings className="h-3.5 w-3.5" />
            {cfg.label} Configuration
          </span>
        </div>
        <h1 className={`text-2xl sm:text-3xl font-bold font-serif ${brandText}`}>
          Business Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your business identity, manager profile, and category system settings.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Business Profile Form */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-500" />
              Business Identity & Store Profile
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              This name appears on client invoices, job sheets, and navigation headers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Business / Studio Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder={isStudio ? "e.g. Dreamlens Photography Studio" : "e.g. Royal Bespoke Tailors"}
                    className="pl-3 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Owner / Manager Full Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Alex Soni"
                    className="pl-3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Account Email (Login Identity)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isSaving} className="font-semibold text-xs sm:text-sm">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-4 w-4" /> Save Business Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Category Features & Switcher */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon className="h-5 w-5 text-amber-500" />
              Active Category Module
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Details about your current business category workflows and permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`p-4 rounded-xl border ${brandBorder} ${brandBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 shadow-xs">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">{cfg.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {cfg.description}
                  </p>
                </div>
              </div>

              <Link href="/select-category">
                <Button variant="outline" size="sm" className="text-xs shrink-0 w-full sm:w-auto">
                  <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                  Switch Business Category
                </Button>
              </Link>
            </div>

            {/* Active Features Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Enabled Business Capabilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { name: "Order & Job Pipeline Tracking", enabled: true },
                  { name: "Expense Logging & Net Profit Calculation", enabled: true },
                  { name: "Client CRM & Order History", enabled: true },
                  { name: "Financial Analytics & Date Reports", enabled: true },
                  { name: "Camera Equipment Tracker & Status", enabled: cfg.features.equipment },
                  { name: "Garment Measurements & Tailoring Specs", enabled: cfg.features.measurements },
                ].map((feat) => (
                  <div
                    key={feat.name}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs ${
                      feat.enabled
                        ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200"
                        : "border-dashed border-slate-200 dark:border-slate-800 opacity-40 text-slate-400"
                    }`}
                  >
                    {feat.enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                    <span>{feat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

