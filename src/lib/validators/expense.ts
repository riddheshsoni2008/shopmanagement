import { z } from "zod";

export const expenseCategories = [
  "Rent",
  "Salary",
  "Electricity",
  "Packaging",
  "Repairs",
  "Transport",
  "Misc",
  "Other",
] as const;

export const expenseSchema = z.object({
  category: z.string().min(1, "Please enter or select a valid expense category"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().optional().default(""),
  date: z.string().or(z.date()),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
