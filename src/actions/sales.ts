"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import { saleSchema, SaleInput } from "@/lib/validators/sale";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getTenantId } from "@/lib/tenant";

export interface SaleHistoryFilter {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function createSale(input: SaleInput): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user?.id || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }
    const userId = session.user.id;

    const validated = saleSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid sale bill details",
      };
    }

    const { customerName, customerPhone, discount, paymentStatus, paymentMethod, items } = validated.data;

    await connectDB();

    // Verify stock availability for all items first
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, userId: tenantId });
      if (!product) {
        return {
          success: false,
          error: `Product "${item.name}" was not found in inventory.`,
        };
      }
      if (product.quantity < item.qty) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.qty}`,
        };
      }
    }

    // Calculate subtotal & final total server-side for security
    let subtotal = 0;
    const processedItems = items.map((item) => {
      const hallmark = item.hallmarkCharge || 0;
      const jadatar = item.jadatarCharge || 0;
      const rhodium = item.rhodiumCharge || 0;
      const nang = item.nangCharge || 0;
      const lineTotal = item.qty * (item.weight * (item.pricePerGram + item.makingCharge) + hallmark + jadatar + rhodium + nang);
      subtotal += lineTotal;
      return {
        product: new mongoose.Types.ObjectId(item.productId),
        name: item.name,
        qty: item.qty,
        weight: item.weight,
        pricePerGram: item.pricePerGram,
        makingCharge: item.makingCharge,
        hallmarkCharge: hallmark,
        jadatarCharge: jadatar,
        rhodiumCharge: rhodium,
        nangCharge: nang,
        lineTotal,
      };
    });

    const totalAmount = Math.max(0, subtotal - discount);

    let saleIdStr = "";

    // Attempt MongoDB Transaction with Session
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // 1. Decrement product stock
        for (const item of items) {
          const res = await Product.updateOne(
            { _id: item.productId, userId: tenantId, quantity: { $gte: item.qty } },
            { $inc: { quantity: -item.qty } },
            { session: dbSession }
          );
          if (res.modifiedCount === 0) {
            throw new Error(`Stock updated failed for "${item.name}" due to concurrency.`);
          }
        }

        // 2. Create Sale document
        const createdSales = await Sale.create(
          [
            {
              userId: tenantId,
              items: processedItems,
              customerName,
              customerPhone,
              discount,
              totalAmount,
              paymentStatus: paymentStatus || "PAID",
              paymentMethod: paymentMethod || "Cash",
              soldBy: new mongoose.Types.ObjectId(userId),
            },
          ],
          { session: dbSession }
        );

        saleIdStr = createdSales[0]._id.toString();
      });
    } catch (transactionErr: any) {
      // Fallback for standalone MongoDB servers where replica set transactions aren't supported
      if (
        transactionErr.message?.includes("Transaction numbers are only allowed") ||
        transactionErr.message?.includes("standalone") ||
        transactionErr.code === 20
      ) {
        // Sequential execution with rollback guard
        const updatedProductIds: { id: string; qty: number }[] = [];
        try {
          for (const item of items) {
            await Product.findOneAndUpdate(
              { _id: item.productId, userId: tenantId },
              { $inc: { quantity: -item.qty } }
            );
            updatedProductIds.push({ id: item.productId, qty: item.qty });
          }

          const createdSale = await Sale.create({
            userId: tenantId,
            items: processedItems,
            customerName,
            customerPhone,
            discount,
            totalAmount,
            paymentStatus: paymentStatus || "PAID",
            paymentMethod: paymentMethod || "Cash",
            soldBy: new mongoose.Types.ObjectId(userId),
          });

          saleIdStr = createdSale._id.toString();
        } catch (fallbackErr: any) {
          // Rollback updated stock
          for (const item of updatedProductIds) {
            await Product.findOneAndUpdate(
              { _id: item.id, userId: tenantId },
              { $inc: { quantity: item.qty } }
            );
          }
          throw fallbackErr;
        }
      } else {
        throw transactionErr;
      }
    } finally {
      await dbSession.endSession();
    }

    revalidatePath("/stock");
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: saleIdStr };
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return {
      success: false,
      error: error.message || "Failed to complete sale transaction",
    };
  }
}

export async function getSales(
  filter: SaleHistoryFilter = {}
): Promise<ActionResult<any>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 10));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId: tenantId };

    if (filter.search && filter.search.trim()) {
      const searchRegex = { $regex: filter.search.trim(), $options: "i" };
      query.$or = [{ customerName: searchRegex }, { customerPhone: searchRegex }];
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) {
        (query.createdAt as any).$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        (query.createdAt as any).$lte = end;
      }
    }

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate("soldBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Sale.countDocuments(query),
    ]);

    const formatted = sales.map((s: any) => ({
      _id: s._id.toString(),
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      discount: s.discount,
      totalAmount: s.totalAmount,
      paymentStatus: s.paymentStatus || "PAID",
      paymentMethod: s.paymentMethod || "Cash",
      itemsCount: s.items?.length || 0,
      items: s.items.map((i: any) => ({
        product: i.product?.toString() || "",
        name: i.name,
        qty: i.qty,
        weight: i.weight,
        pricePerGram: i.pricePerGram,
        makingCharge: i.makingCharge || 0,
        hallmarkCharge: i.hallmarkCharge || 0,
        jadatarCharge: i.jadatarCharge || 0,
        rhodiumCharge: i.rhodiumCharge || 0,
        nangCharge: i.nangCharge || 0,
        lineTotal: i.lineTotal,
      })),
      soldBy: s.soldBy ? { name: s.soldBy.name, email: s.soldBy.email } : { name: "Staff" },
      createdAt: new Date(s.createdAt).toISOString(),
    }));

    return {
      success: true,
      data: {
        sales: formatted,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error) {
    console.error("Error fetching sales history:", error);
    return { success: false, error: "Failed to fetch sales history" };
  }
}

export async function getSaleById(id: string): Promise<ActionResult<any>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    const sale = await Sale.findOne({ _id: id, userId: tenantId }).populate("soldBy", "name email").lean();
    if (!sale) {
      return { success: false, error: "Sale record not found" };
    }

    const formatted = {
      _id: (sale._id as any).toString(),
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      discount: sale.discount,
      totalAmount: sale.totalAmount,
      paymentStatus: (sale as any).paymentStatus || "PAID",
      paymentMethod: (sale as any).paymentMethod || "Cash",
      items: sale.items.map((i: any) => ({
        product: i.product?.toString() || "",
        name: i.name,
        qty: i.qty,
        weight: i.weight,
        pricePerGram: i.pricePerGram,
        makingCharge: i.makingCharge || 0,
        hallmarkCharge: i.hallmarkCharge || 0,
        jadatarCharge: i.jadatarCharge || 0,
        rhodiumCharge: i.rhodiumCharge || 0,
        nangCharge: i.nangCharge || 0,
        lineTotal: i.lineTotal,
      })),
      soldBy: sale.soldBy ? { name: (sale.soldBy as any).name, email: (sale.soldBy as any).email } : { name: "Staff" },
      createdAt: new Date(sale.createdAt).toISOString(),
    };

    return { success: true, data: formatted };
  } catch (error) {
    return { success: false, error: "Failed to fetch invoice details" };
  }
}
