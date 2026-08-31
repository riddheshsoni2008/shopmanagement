"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { productSchema, ProductInput } from "@/lib/validators/product";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/tenant";

export interface GetProductsFilter {
  search?: string;
  category?: string;
  metal?: string;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  products: Array<{
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
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export async function getProducts(
  filter: GetProductsFilter = {}
): Promise<ActionResult<PaginatedProducts>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(1000, filter.limit || 10));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId: tenantId };

    if (filter.search && filter.search.trim()) {
      query.name = { $regex: filter.search.trim(), $options: "i" };
    }

    if (filter.category && filter.category !== "ALL") {
      query.category = filter.category;
    }

    if (filter.metal && filter.metal !== "ALL") {
      query.metal = filter.metal;
    }

    if (filter.lowStockOnly) {
      query.$expr = { $lte: ["$quantity", "$lowStockThreshold"] };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const formatted = products.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      category: p.category,
      metal: p.metal,
      purity: p.purity,
      size: p.size || "",
      weightPerPiece: p.weightPerPiece,
      quantity: p.quantity,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      lowStockThreshold: p.lowStockThreshold,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : "",
    }));

    return {
      success: true,
      data: {
        products: formatted,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error) {
    console.error("Error in getProducts:", error);
    return { success: false, error: "Failed to fetch stock products" };
  }
}

export async function getProductById(id: string): Promise<ActionResult<any>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    const product = await Product.findOne({ _id: id, userId: tenantId }).lean();
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const formatted = {
      _id: (product._id as any).toString(),
      name: product.name,
      category: product.category,
      metal: product.metal,
      purity: product.purity,
      size: product.size || "",
      weightPerPiece: product.weightPerPiece,
      quantity: product.quantity,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      lowStockThreshold: product.lowStockThreshold,
      createdAt: new Date(product.createdAt).toISOString(),
      updatedAt: new Date(product.updatedAt).toISOString(),
    };

    return { success: true, data: formatted };
  } catch (error) {
    return { success: false, error: "Failed to fetch product details" };
  }
}

export async function createProduct(input: ProductInput): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    const validated = productSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid product details",
      };
    }

    await connectDB();

    const newProduct = await Product.create({
      ...validated.data,
      userId: tenantId,
    });

    revalidatePath("/stock");
    revalidatePath("/dashboard");

    return { success: true, data: newProduct._id.toString() };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    const validated = productSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid product details",
      };
    }

    await connectDB();

    const updated = await Product.findOneAndUpdate(
      { _id: id, userId: tenantId },
      validated.data,
      { new: true }
    );

    if (!updated) {
      return { success: false, error: "Product not found for update" };
    }

    revalidatePath("/stock");
    revalidatePath(`/stock/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: "Product updated successfully" };
  } catch (error) {
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    const role = (session.user as any).role;
    if (role !== "admin") {
      return { success: false, error: "Only admins can delete inventory products" };
    }

    await connectDB();

    const deleted = await Product.findOneAndDelete({ _id: id, userId: tenantId });
    if (!deleted) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/stock");
    revalidatePath("/dashboard");

    return { success: true, data: "Product deleted successfully" };
  } catch (error) {
    return { success: false, error: "Failed to delete product" };
  }
}
