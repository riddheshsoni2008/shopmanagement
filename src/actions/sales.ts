"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";
import { saleSchema, SaleInput } from "@/lib/validators/sale";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getTenantId } from "@/lib/tenant";

export async function createSale(input: SaleInput): Promise<ActionResult<{ saleId: string }>> {
  let session: mongoose.ClientSession | null = null;
  try {
    const authSession = await auth();
    const tenantId = await getTenantId();
    if (!authSession?.user?.id || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }
    const userId = authSession.user.id;

    const validated = saleSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid sale input payload",
      };
    }

    await connectDB();

    // Use MongoDB Client Session for Atomic Transaction
    const conn = mongoose.connection;
    session = await conn.startSession();

    let newSaleId: string = "";

    await session.withTransaction(async () => {
      let subtotal = 0;
      const populatedItems = [];

      for (const itemInput of validated.data.items) {
        // Fetch product and verify stock under active tenant
        const product = await Product.findOne({
          _id: itemInput.productId,
          userId: tenantId,
        }).session(session);

        if (!product) {
          throw new Error(`Product not found: ${itemInput.productId}`);
        }

        if (product.quantity < itemInput.qty) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${itemInput.qty}`
          );
        }

        // Deduct inventory stock quantity & total weight
        const rawPWeight = itemInput.productWeight ?? itemInput.weight ?? 0;
        const pUnit = itemInput.productWeightUnit || "g";
        const pWeightGrams = pUnit === "mg" ? rawPWeight / 1000 : rawPWeight;

        const rawJWeight = itemInput.jadatarWeight ?? 0;
        const jUnit = itemInput.jadatarWeightUnit || "g";
        const jWeightGrams = jUnit === "mg" ? rawJWeight / 1000 : rawJWeight;

        const rawNWeight = itemInput.nangWeight ?? 0;
        const nUnit = itemInput.nangWeightUnit || "g";
        const nWeightGrams = nUnit === "mg" ? rawNWeight / 1000 : rawNWeight;

        const rawMWeight = itemInput.meenoWeight ?? 0;
        const mUnit = itemInput.meenoWeightUnit || "g";
        const mWeightGrams = mUnit === "mg" ? rawMWeight / 1000 : rawMWeight;

        const calculatedNetWeight = Math.max(0, Number((pWeightGrams - jWeightGrams - nWeightGrams - mWeightGrams).toFixed(4)));
        const netWeight = itemInput.netWeight !== undefined && itemInput.netWeight > 0 ? itemInput.netWeight : calculatedNetWeight;

        product.quantity -= itemInput.qty;
        const totalSoldWeight = itemInput.qty * pWeightGrams;
        product.weightPerPiece = Math.max(
          0,
          Number((product.weightPerPiece - totalSoldWeight).toFixed(4))
        );
        await product.save({ session });

        // Calculate item line total based on Net Weight
        const weightTotal = itemInput.qty * netWeight;
        const metalCost = weightTotal * itemInput.pricePerGram;
        const makingCost = weightTotal * (itemInput.makingCharge || 0);

        const hallmarkCost = itemInput.hallmarkCharge || 0;
        const jadatarCost = itemInput.jadatarCharge || 0;
        const rhodiumCost = itemInput.rhodiumCharge || 0;
        const nangCost = itemInput.nangCharge || 0;
        const meenoCost = itemInput.meenoCharge || 0;

        const lineTotal =
          metalCost + makingCost + hallmarkCost + jadatarCost + rhodiumCost + nangCost + meenoCost;

        subtotal += lineTotal;

        populatedItems.push({
          product: product._id,
          name: product.name,
          qty: itemInput.qty,
          weight: netWeight,
          productWeight: rawPWeight,
          productWeightUnit: pUnit,
          jadatarWeight: rawJWeight,
          jadatarWeightUnit: jUnit,
          nangWeight: rawNWeight,
          nangWeightUnit: nUnit,
          meenoWeight: rawMWeight,
          meenoWeightUnit: mUnit,
          netWeight: netWeight,
          pricePerGram: itemInput.pricePerGram,
          makingCharge: itemInput.makingCharge || 0,
          hallmarkCharge: hallmarkCost,
          jadatarCharge: jadatarCost,
          rhodiumCharge: rhodiumCost,
          nangCharge: nangCost,
          meenoCharge: meenoCost,
          lineTotal,
        });
      }

      const discount = validated.data.discount || 0;
      const totalAmount = Math.max(0, subtotal - discount);

      // Create sale bill record with tenantId
      const newSale = await Sale.create(
        [
          {
            userId: tenantId,
            customerName: validated.data.customerName,
            customerPhone: validated.data.customerPhone,
            customerAddress: validated.data.customerAddress || "",
            items: populatedItems,
            discount,
            totalAmount,
            paymentStatus: validated.data.paymentStatus || "PAID",
            paymentMethod: validated.data.paymentMethod || "Cash",
            showGst: validated.data.showGst ?? true,
            soldBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      newSaleId = newSale[0]._id.toString();
    });

    revalidatePath("/sales");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return {
      success: true,
      data: { saleId: newSaleId },
    };
  } catch (error: any) {
    console.error("Transaction Error in createSale:", error);
    return {
      success: false,
      error: error.message || "Failed to complete sales transaction bill",
    };
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

export async function getSales(
  pageOrOptions?: number | { page?: number; limit?: number; search?: string },
  limitParam: number = 10,
  searchParam?: string
): Promise<ActionResult<any>> {
  let page = 1;
  let limit = limitParam;
  let search = searchParam;

  if (typeof pageOrOptions === "object" && pageOrOptions !== null) {
    page = pageOrOptions.page ?? 1;
    limit = pageOrOptions.limit ?? 10;
    search = pageOrOptions.search ?? searchParam;
  } else if (typeof pageOrOptions === "number") {
    page = pageOrOptions;
  }
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { userId: tenantId };

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { customerName: { $regex: q, $options: "i" } },
        { customerPhone: { $regex: q, $options: "i" } },
        { customerAddress: { $regex: q, $options: "i" } },
      ];
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
      customerAddress: s.customerAddress || "",
      discount: s.discount,
      totalAmount: s.totalAmount,
      paymentStatus: s.paymentStatus || "PAID",
      paymentMethod: s.paymentMethod || "Cash",
      showGst: s.showGst ?? true,
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
        meenoCharge: i.meenoCharge || 0,
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
      customerAddress: (sale as any).customerAddress || "",
      discount: sale.discount,
      totalAmount: sale.totalAmount,
      paymentStatus: (sale as any).paymentStatus || "PAID",
      paymentMethod: (sale as any).paymentMethod || "Cash",
      showGst: (sale as any).showGst ?? true,
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
        meenoCharge: i.meenoCharge || 0,
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

export async function bulkDeleteSales(ids: string[]): Promise<ActionResult<{ deletedCount: number }>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    const role = (session.user as any).role;
    if (role !== "admin") {
      return { success: false, error: "Only admins can delete sales records" };
    }

    if (!ids || ids.length === 0) {
      return { success: true, data: { deletedCount: 0 } };
    }

    await connectDB();

    const result = await Sale.deleteMany({
      _id: { $in: ids },
      userId: tenantId,
    });

    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: { deletedCount: result.deletedCount || 0 } };
  } catch (error) {
    console.error("Error bulk deleting sales records:", error);
    return { success: false, error: "Failed to delete sales records" };
  }
}
