import mongoose, { Schema, Document, Model } from "mongoose";
import type { BusinessCategory } from "@/lib/category-config";

export interface IOrderExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  businessCategory: BusinessCategory;
  category: string;
  amount: number;
  note?: string;
  date: Date;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const OrderExpenseSchema = new Schema<IOrderExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    businessCategory: {
      type: String,
      enum: ["studio", "clothing"],
      required: true,
    },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: "" },
    date: { type: Date, required: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

OrderExpenseSchema.index({ userId: 1, orderId: 1 });
OrderExpenseSchema.index({ userId: 1, businessCategory: 1, date: -1 });

export const OrderExpense: Model<IOrderExpense> =
  mongoose.models.OrderExpense ||
  mongoose.model<IOrderExpense>("OrderExpense", OrderExpenseSchema);
