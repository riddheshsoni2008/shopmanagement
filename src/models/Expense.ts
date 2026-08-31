import mongoose, { Schema, Document, Model } from "mongoose";

export type ExpenseCategory = string;

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  category: ExpenseCategory;
  amount: number;
  note: string;
  date: Date;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", trim: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ExpenseSchema.index({ userId: 1, date: -1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
