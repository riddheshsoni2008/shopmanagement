import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Product name is required"),
  qty: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  productWeight: z.coerce.number().min(0, "Product weight cannot be negative").default(0),
  productWeightUnit: z.enum(["g", "mg"]).default("g"),
  jadatarWeight: z.coerce.number().min(0, "Jadatar weight cannot be negative").default(0),
  jadatarWeightUnit: z.enum(["g", "mg"]).default("g"),
  nangWeight: z.coerce.number().min(0, "Nang weight cannot be negative").default(0),
  nangWeightUnit: z.enum(["g", "mg"]).default("g"),
  meenoWeight: z.coerce.number().min(0, "Meeno weight cannot be negative").default(0),
  meenoWeightUnit: z.enum(["g", "mg"]).default("g"),
  netWeight: z.coerce.number().min(0, "Net weight cannot be negative").default(0),
  weight: z.coerce.number().min(0, "Weight cannot be negative").default(0),
  pricePerGram: z.coerce.number().min(0, "Price per gram cannot be negative"),
  makingCharge: z.coerce.number().min(0, "Making charge cannot be negative").default(0),
  hallmarkCharge: z.coerce.number().min(0, "Hallmark charge cannot be negative").default(0),
  jadatarCharge: z.coerce.number().min(0, "Jadatar charge cannot be negative").default(0),
  rhodiumCharge: z.coerce.number().min(0, "Rhodium charge cannot be negative").default(0),
  nangCharge: z.coerce.number().min(0, "Nang charge cannot be negative").default(0),
  meenoCharge: z.coerce.number().min(0, "Meeno charge cannot be negative").default(0),
  lineTotal: z.coerce.number().min(0, "Line total cannot be negative"),
});

export const saleSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  customerPhone: z
    .string()
    .min(10, "Customer phone number must be at least 10 digits"),
  customerAddress: z.string().optional().default(""),
  discount: z.coerce.number().min(0, "Discount cannot be negative").default(0),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL"]).default("PAID"),
  paymentMethod: z.enum(["Cash", "UPI / GPay", "Card", "Bank Transfer"]).default("Cash"),
  showGst: z.boolean().optional().default(true),
  items: z
    .array(saleItemSchema)
    .min(1, "At least one item is required in the sale bill"),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
