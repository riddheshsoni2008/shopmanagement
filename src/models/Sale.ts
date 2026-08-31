import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISaleItem {
  product: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  weight: number;
  productWeight?: number;
  productWeightUnit?: "g" | "mg";
  jadatarWeight?: number;
  jadatarWeightUnit?: "g" | "mg";
  nangWeight?: number;
  nangWeightUnit?: "g" | "mg";
  meenoWeight?: number;
  meenoWeightUnit?: "g" | "mg";
  netWeight?: number;
  pricePerGram: number;
  makingCharge: number;
  hallmarkCharge: number;
  jadatarCharge: number;
  rhodiumCharge: number;
  nangCharge: number;
  meenoCharge: number;
  lineTotal: number;
}

export interface ISale extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: ISaleItem[];
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  discount: number;
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";
  paymentMethod: "Cash" | "UPI / GPay" | "Card" | "Bank Transfer";
  showGst?: boolean;
  soldBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true, min: 0 },
  productWeight: { type: Number, default: 0 },
  productWeightUnit: { type: String, enum: ["g", "mg"], default: "g" },
  jadatarWeight: { type: Number, default: 0 },
  jadatarWeightUnit: { type: String, enum: ["g", "mg"], default: "g" },
  nangWeight: { type: Number, default: 0 },
  nangWeightUnit: { type: String, enum: ["g", "mg"], default: "g" },
  meenoWeight: { type: Number, default: 0 },
  meenoWeightUnit: { type: String, enum: ["g", "mg"], default: "g" },
  netWeight: { type: Number, default: 0 },
  pricePerGram: { type: Number, required: true, min: 0 },
  makingCharge: { type: Number, required: true, default: 0 },
  hallmarkCharge: { type: Number, required: true, default: 0 },
  jadatarCharge: { type: Number, required: true, default: 0 },
  rhodiumCharge: { type: Number, required: true, default: 0 },
  nangCharge: { type: Number, required: true, default: 0 },
  meenoCharge: { type: Number, required: true, default: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
});

const SaleSchema = new Schema<ISale>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [SaleItemSchema],
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerAddress: { type: String, default: "", trim: true },
    discount: { type: Number, required: true, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["PAID", "PENDING", "PARTIAL"],
      default: "PAID",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI / GPay", "Card", "Bank Transfer"],
      default: "Cash",
    },
    showGst: { type: Boolean, default: true },
    soldBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

SaleSchema.index({ userId: 1, createdAt: -1 });

export const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
