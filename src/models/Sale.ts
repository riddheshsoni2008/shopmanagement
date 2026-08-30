import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISaleItem {
  product: mongoose.Types.ObjectId;
  name: string;
  qty: number;
  weight: number;
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
  discount: number;
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";
  paymentMethod: "Cash" | "UPI / GPay" | "Card" | "Bank Transfer";
  soldBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true, min: 0 },
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
    soldBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

SaleSchema.index({ userId: 1, createdAt: -1 });

export const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
