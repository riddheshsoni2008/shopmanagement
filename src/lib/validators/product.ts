import { z } from "zod";

export const productCategories = [
  "Payal",
  "Necklace",
  "Ring",
  "Earring",
  "Bangle",
  "Pendant",
  "Chain",
  "Bracelet",
] as const;

export const productMetals = ["Gold", "Silver", "Platinum"] as const;

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  category: z.enum(productCategories, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  metal: z.enum(productMetals, {
    errorMap: () => ({ message: "Please select a valid metal type" }),
  }),
  purity: z.string().min(1, "Purity is required (e.g. 22K, 18K, 925)"),
  size: z.string().optional(),
  weightPerPiece: z.coerce
    .number()
    .positive("Weight must be greater than 0"),
  quantity: z.coerce
    .number()
    .int("Quantity must be an integer")
    .min(0, "Quantity cannot be negative"),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price cannot be negative"),
  sellingPrice: z.coerce
    .number()
    .min(0, "Selling price cannot be negative"),
  lowStockThreshold: z.coerce
    .number()
    .int("Threshold must be an integer")
    .min(0, "Threshold cannot be negative")
    .default(3),
  imageUrl: z
    .string()
    .url("Must be a valid image URL")
    .optional()
    .or(z.literal("")),
});

export type ProductInput = z.infer<typeof productSchema>;
