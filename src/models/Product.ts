import mongoose, { Schema, Document, Model } from "mongoose";

export type ProductCategory =
  | "Payal"
  | "Necklace"
  | "Ring"
  | "Earring"
  | "Bangle"
  | "Pendant"
  | "Chain"
  | "Bracelet";

export type ProductMetal = "Gold" | "Silver" | "Platinum";

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  category: ProductCategory;
  metal: ProductMetal;
  purity: string;
  size?: string;
  weightPerPiece: number;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Payal",
        "Necklace",
        "Ring",
        "Earring",
        "Bangle",
        "Pendant",
        "Chain",
        "Bracelet",
      ],
      index: true,
    },
    metal: {
      type: String,
      required: true,
      enum: ["Gold", "Silver", "Platinum"],
      index: true,
    },
    purity: { type: String, required: true, trim: true },
    size: { type: String, trim: true },
    weightPerPiece: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    lowStockThreshold: { type: Number, required: true, default: 3 },
    imageUrl: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ userId: 1, category: 1, metal: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
