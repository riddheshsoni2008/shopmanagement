import { getRateSettings } from "@/actions/settings";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { Settings } from "lucide-react";

export const revalidate = 0; // SSR live rendering

export default async function SettingsPage() {
  const session = await auth();

  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const res = await getRateSettings();
  if (!res.success || !res.data) {
    return (
      <div className="py-12 text-center text-slate-400">
        Failed to load rate settings.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold font-serif text-amber-400 sm:text-3xl flex items-center gap-2">
          <Settings className="h-7 w-7 text-amber-400" /> Shop Settings & Daily Rates
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Admin panel for configuring daily 22K/18K Gold and Silver market rates and store parameters.
        </p>
      </div>

      <SettingsForm initialRates={res.data} />
    </div>
  );
}
