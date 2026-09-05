import mongoose, { Schema, Document, Model } from "mongoose";
import type { BusinessCategory } from "@/lib/category-config";

export interface IClient extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  businessCategory: BusinessCategory;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    businessCategory: {
      type: String,
      enum: ["jewelry", "studio", "clothing"],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

ClientSchema.index({ userId: 1, businessCategory: 1, createdAt: -1 });
ClientSchema.index({ userId: 1, phone: 1 });

export const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
