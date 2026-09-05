import mongoose, { Schema, Document, Model } from "mongoose";
import type { BusinessCategory } from "@/lib/category-config";

export type OrderStatus = "received" | "in_progress" | "completed" | "delivered";

export interface IStudioExtra {
  photographerName?: string;
  photographerId?: mongoose.Types.ObjectId;
  venueAddress?: string;
}

export interface IClothingExtra {
  measurementNotes?: string;
  fabricDetails?: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  businessCategory: BusinessCategory;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  clientPhone: string;
  orderNumber: string;
  orderType: string;
  orderDate: Date;
  dueDate?: Date;
  status: OrderStatus;
  agreedAmount: number;
  advanceReceived: number;
  description?: string;
  studioExtra?: IStudioExtra;
  clothingExtra?: IClothingExtra;
  createdAt: Date;
  updatedAt: Date;
}

const StudioExtraSchema = new Schema<IStudioExtra>(
  {
    photographerName: { type: String, trim: true, default: "" },
    photographerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    venueAddress: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const ClothingExtraSchema = new Schema<IClothingExtra>(
  {
    measurementNotes: { type: String, trim: true, default: "" },
    fabricDetails: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    businessCategory: {
      type: String,
      enum: ["studio", "clothing"],
      required: true,
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true },
    orderNumber: { type: String, required: true, trim: true },
    orderType: { type: String, required: true, trim: true },
    orderDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["received", "in_progress", "completed", "delivered"],
      default: "received",
      index: true,
    },
    agreedAmount: { type: Number, required: true, min: 0 },
    advanceReceived: { type: Number, required: true, default: 0, min: 0 },
    description: { type: String, trim: true, default: "" },
    studioExtra: { type: StudioExtraSchema, default: null },
    clothingExtra: { type: ClothingExtraSchema, default: null },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, businessCategory: 1, status: 1 });
OrderSchema.index({ userId: 1, businessCategory: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, clientId: 1 });
OrderSchema.index({ userId: 1, orderNumber: 1 }, { unique: true });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
