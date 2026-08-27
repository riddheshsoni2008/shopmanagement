"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productSchema,
  ProductInput,
  productCategories,
  productMetals,
} from "@/lib/validators/product";
import { createProduct, updateProduct } from "@/actions/stock";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    _id: string;
    name: string;
    category: string;
    metal: string;
    purity: string;
    size?: string;
    weightPerPiece: number;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
    imageUrl?: string;
  } | null;
}

export function ProductDialog({ isOpen, onClose, product }: ProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "Necklace",
      metal: "Gold",
      purity: "22K",
      size: "",
      weightPerPiece: 10,
      quantity: 5,
      purchasePrice: 65000,
      sellingPrice: 75000,
      lowStockThreshold: 3,
      imageUrl: "",
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category: product.category as any,
        metal: product.metal as any,
        purity: product.purity,
        size: product.size || "",
        weightPerPiece: product.weightPerPiece,
        quantity: product.quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        lowStockThreshold: product.lowStockThreshold,
        imageUrl: product.imageUrl || "",
      });
    } else {
      reset({
        name: "",
        category: "Necklace",
        metal: "Gold",
        purity: "22K",
        size: "",
        weightPerPiece: 10,
        quantity: 5,
        purchasePrice: 65000,
        sellingPrice: 75000,
        lowStockThreshold: 3,
        imageUrl: "",
      });
    }
  }, [product, reset, isOpen]);

  const onSubmit = async (values: ProductInput) => {
    setIsSubmitting(true);
    try {
      if (isEditing && product) {
        const res = await updateProduct(product._id, values);
        if (res.success) {
          toast.success("Inventory item updated successfully!");
          onClose();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createProduct(values);
        if (res.success) {
          toast.success("New product added to inventory!");
          onClose();
        } else {
          toast.error(res.error);
        }
      }
    } catch (err) {
      toast.error("Failed to save product details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return ( 
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Inventory Product" : "Add New Jewelry Product"}
      description="Enter product details, metal purity, stock levels, and pricing."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Item Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300">
            Product Title / Name *
          </label>
          <Input
            placeholder="e.g. Royal Royal 22K Gold Antique Necklace"
            {...register("name")}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>
          )}
        </div>

        {/* Category & Metal Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Jewelry Category *
            </label>
            <Select {...register("category")} disabled={isSubmitting}>
              {productCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
            {errors.category && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Metal Type *
            </label>
            <Select {...register("metal")} disabled={isSubmitting}>
              {productMetals.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            {errors.metal && (
              <p className="mt-1 text-xs text-rose-400 font-medium">
                {errors.metal.message}
              </p>
            )}
          </div>
        </div>

        {/* Purity & Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Purity (e.g. 22K, 18K, 925) *
            </label>
            <Input
              placeholder="22K"
              {...register("purity")}
              disabled={isSubmitting}
            />
            {errors.purity && (
              <p className="mt-1 text-xs text-rose-400">{errors.purity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Size / Dimensions (Optional)
            </label>
            <Input
              placeholder="18 inch / 2.4 inch"
              {...register("size")}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Weight & Stock Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Weight / Piece (Grams) *
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("weightPerPiece")}
              disabled={isSubmitting}
            />
            {errors.weightPerPiece && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.weightPerPiece.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Initial Quantity in Stock *
            </label>
            <Input
              type="number"
              {...register("quantity")}
              disabled={isSubmitting}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Low Stock Alert Min *
            </label>
            <Input
              type="number"
              {...register("lowStockThreshold")}
              disabled={isSubmitting}
            />
            {errors.lowStockThreshold && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.lowStockThreshold.message}
              </p>
            )}
          </div>
        </div>

        {/* Purchase & Selling Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Cost / Purchase Price (₹) *
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("purchasePrice")}
              disabled={isSubmitting}
            />
            {errors.purchasePrice && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.purchasePrice.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">
              Retail Selling Price (₹) *
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("sellingPrice")}
              disabled={isSubmitting}
            />
            {errors.sellingPrice && (
              <p className="mt-1 text-xs text-rose-400">
                {errors.sellingPrice.message}
              </p>
            )}
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-300">
            Image URL String (Optional)
          </label>
          <Input
            placeholder="https://images.unsplash.com/photo-..."
            {...register("imageUrl")}
            disabled={isSubmitting}
          />
          {errors.imageUrl && (
            <p className="mt-1 text-xs text-rose-400">{errors.imageUrl.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="px-6 font-bold">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : isEditing ? (
              "Update Item"
            ) : (
              "Save Product"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
