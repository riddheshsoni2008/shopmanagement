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
  const [selectedCategory, setSelectedCategory] = useState("Rent");
  const [customCategory, setCustomCategory] = useState("");
  const [customCategoryError, setCustomCategoryError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCategory(val);
    setCustomCategoryError("");
    if (val !== "Other") {
      setValue("category", val);
    } else {
      setValue("category", customCategory.trim());
    }
  };

  const onSubmit = async (values: ExpenseInput) => {
    let finalCategory = selectedCategory;
    if (selectedCategory === "Other") {
      if (!customCategory.trim()) {
        setCustomCategoryError("Please enter a custom expense category name");
        return;
      }
      finalCategory = customCategory.trim();
    }

    setIsSubmitting(true);
    try {
      const res = await createExpense({
        ...values,
        category: finalCategory,
      });
      if (res.success) {
        toast.success("Expense logged successfully!");
        reset();
        setSelectedCategory("Rent");
        setCustomCategory("");
        setCustomCategoryError("");
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
      description="Track shop operational expenses like Rent, Salaries, Electricity, or custom expenses."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Expense Category *
          </label>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            disabled={isSubmitting}
          >
            {expenseCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "Other" ? "Other (Custom Category)" : cat}
              </option>
            ))}
          </Select>

          {/* Custom Category Input Field when 'Other' is selected */}
          {selectedCategory === "Other" && (
            <div className="mt-2.5">
              <label className="block text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">
                Enter Custom Category Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Tea & Snacks, Shop Maintenance, Audit Fee..."
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value);
                  setValue("category", e.target.value);
                  setCustomCategoryError("");
                }}
                disabled={isSubmitting}
                autoFocus
              />
              {customCategoryError && (
                <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{customCategoryError}</p>
              )}
            </div>
          )}

          {errors.category && !customCategoryError && (
            <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.category.message}</p>
          )}
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description / Memo (Optional)
          </label>
          <Input
            placeholder={
              selectedCategory === "Gold Purchase"
                ? "e.g. Bought 50g 22k raw gold / old gold from supplier"
                : selectedCategory === "Silver Purchase"
                ? "e.g. Purchased 1kg silver bullion"
                : "e.g. Monthly shop rent for Main Market Branch"
            }
            {...register("note")}
            disabled={isSubmitting}
          />
          {selectedCategory === "Gold Purchase" && (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              💡 Gold & metal purchases are automatically aggregated into your total shop expenses and financial reports.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-amber-100 dark:border-slate-800">
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
