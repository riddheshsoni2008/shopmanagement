import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "staff";
  ownerId?: mongoose.Types.ObjectId;
  goldRate22k?: number;
  goldRate18k?: number;
  silverRate?: number;
  shopName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "admin" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    goldRate22k: { type: Number, default: 7200 },
    goldRate18k: { type: Number, default: 5900 },
    silverRate: { type: Number, default: 85 },
    shopName: { type: String, default: "Zeal Jewellers" },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
