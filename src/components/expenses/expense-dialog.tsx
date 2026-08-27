"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseInput, expenseCategories } from "@/lib/validators/expense";
import { createExpense } from "@/actions/expenses";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseDialog({ isOpen, onClose }: ExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "Rent",
      amount: 15000,
      note: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (values: ExpenseInput) => {
    setIsSubmitting(true);
    try {
      const res = await createExpense(values);
      if (res.success) {
        toast.success("Expense logged successfully!");
        reset();
        onClose();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to log expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record Operating Expense"
      description="Track shop operational expenses like Rent, Salaries, Electricity, or Transport."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-300">
            Expense Category *
          </label>
          <Select {...register("category")} disabled={isSubmitting}>
            {expenseCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
          {errors.category && (
            <p className="mt-1 text-xs text-rose-400">{errors.category.message}</p>
          )}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Amount Spent (₹) *
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 25000"
              {...register("amount")}
              disabled={isSubmitting}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-400">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Expense Date *
            </label>
            <Input
              type="date"
              {...register("date")}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Note / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300">
            Description / Memo (Optional)
          </label>
          <Input
            placeholder="e.g. Monthly shop rent for Main Market Branch"
            {...register("note")}
            disabled={isSubmitting}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="font-bold">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Log Expense Entry"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
