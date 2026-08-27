import { getExpenses } from "@/actions/expenses";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ExpenseView } from "@/components/expenses/expense-view";
import { DollarSign } from "lucide-react";

export const revalidate = 0; // SSR live data

export default async function ExpensesPage() {
  const session = await auth();

  if ((session?.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const res = await getExpenses();
  const initialData = res.success
    ? res.data
    : { expenses: [], categoryTotals: {}, totalExpenses: 0 };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold font-serif text-amber-400 sm:text-3xl flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-amber-400" /> Operational Expense Management
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Admin portal for logging rent, staff salaries, electricity bills, and store overheads.
        </p>
      </div>

      <ExpenseView initialData={initialData} />
    </div>
  );
}
