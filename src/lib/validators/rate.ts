import { z } from "zod";

export const rateSchema = z.object({
  goldRate22k: z.coerce.number().positive("22K Gold rate must be positive"),
  goldRate18k: z.coerce.number().positive("18K Gold rate must be positive"),
  silverRate: z.coerce.number().positive("Silver rate must be positive"),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters").optional().or(z.literal("")),
});

export type RateInput = z.infer<typeof rateSchema>;
