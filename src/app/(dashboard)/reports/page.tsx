import { getReportData } from "@/actions/reports";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsView } from "@/components/reports/reports-view";
import { BarChart3 } from "lucide-react";

export const revalidate = 0; // SSR live rendering

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const res = await getReportData();
  if (!res.success || !res.data) {
    return (
      <div className="py-12 text-center text-slate-400">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold font-serif text-amber-400 sm:text-3xl flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-amber-400" /> Executive Analytics & Financial Reports
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Admin portal for analyzing revenue trends, net profit, average order values, and expense distributions.
        </p>
      </div>

      <ReportsView initialData={res.data} />
    </div>
  );
}
