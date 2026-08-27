import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRate extends Document {
  _id: mongoose.Types.ObjectId;
  goldRate22k: number;
  goldRate18k: number;
  silverRate: number;
  shopName: string;
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

const RateSchema = new Schema<IRate>(
  {
    goldRate22k: { type: Number, required: true, min: 0, default: 7200 },
    goldRate18k: { type: Number, required: true, min: 0, default: 5900 },
    silverRate: { type: Number, required: true, min: 0, default: 85 },
    shopName: { type: String, required: true, default: "Aura Luxury Jewelers" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export const Rate: Model<IRate> =
  mongoose.models.Rate || mongoose.model<IRate>("Rate", RateSchema);
