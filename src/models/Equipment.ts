import mongoose, { Schema, Document, Model } from "mongoose";

export type EquipmentOwnership = "owned" | "rented";
export type EquipmentCondition = "good" | "needs_service" | "in_repair" | "retired";
export type EquipmentType =
  | "camera"
  | "lens"
  | "lighting"
  | "drone"
  | "audio"
  | "tripod_stabilizer"
  | "backdrop_props"
  | "editing_hardware"
  | "other";

export interface IEquipment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: EquipmentType;
  ownership: EquipmentOwnership;
  purchaseDate?: Date;
  rentalExpiryDate?: Date;
  serviceNextDue?: Date;
  condition: EquipmentCondition;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "camera",
        "lens",
        "lighting",
        "drone",
        "audio",
        "tripod_stabilizer",
        "backdrop_props",
        "editing_hardware",
        "other",
      ],
      required: true,
    },
    ownership: {
      type: String,
      enum: ["owned", "rented"],
      required: true,
      default: "owned",
    },
    purchaseDate: { type: Date, default: null },
    rentalExpiryDate: { type: Date, default: null },
    serviceNextDue: { type: Date, default: null },
    condition: {
      type: String,
      enum: ["good", "needs_service", "in_repair", "retired"],
      default: "good",
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

EquipmentSchema.index({ userId: 1, serviceNextDue: 1 });
EquipmentSchema.index({ userId: 1, condition: 1 });

export const Equipment: Model<IEquipment> =
  mongoose.models.Equipment ||
  mongoose.model<IEquipment>("Equipment", EquipmentSchema);
