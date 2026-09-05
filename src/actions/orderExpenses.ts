"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { OrderExpense } from "@/models/OrderExpense";
import { Order } from "@/models/Order";
import { getTenantId } from "@/lib/tenant";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export interface OrderExpenseInput {
  orderId: string;
  category: string;
  amount: number;
  note?: string;
  date: string;
}

// ─── Add Expense to Order ─────────────────────────────────────────────────────

export async function addOrderExpense(
  input: OrderExpenseInput
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user?.id || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    if (!input.category?.trim()) {
      return { success: false, error: "Expense category is required" };
    }
    if (input.amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    await connectDB();

    const order = await Order.findOne({ _id: input.orderId, userId: tenantId });
    if (!order) return { success: false, error: "Order not found" };

    const expense = await OrderExpense.create({
      userId: tenantId,
      orderId: new mongoose.Types.ObjectId(input.orderId),
      businessCategory: order.businessCategory,
      category: input.category.trim(),
      amount: input.amount,
      note: input.note?.trim() || "",
      date: new Date(input.date),
      addedBy: new mongoose.Types.ObjectId(session.user.id),
    });

    revalidatePath(
      `/dashboard/${order.businessCategory}/orders/${input.orderId}`
    );
    revalidatePath(`/dashboard/${order.businessCategory}/dashboard`);

    return { success: true, data: expense._id.toString() };
  } catch (error: any) {
    console.error("addOrderExpense error:", error);
    return { success: false, error: "Failed to add expense" };
  }
}

// ─── Delete Order Expense ─────────────────────────────────────────────────────

export async function deleteOrderExpense(
  id: string
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    await connectDB();

    const expense = await OrderExpense.findOne({ _id: id, userId: tenantId });
    if (!expense) return { success: false, error: "Expense not found" };

    const orderId = expense.orderId.toString();
    const cat = expense.businessCategory;

    await OrderExpense.deleteOne({ _id: id });

    revalidatePath(`/dashboard/${cat}/orders/${orderId}`);
    revalidatePath(`/dashboard/${cat}/dashboard`);

    return { success: true, data: "Expense deleted" };
  } catch (error: any) {
    return { success: false, error: "Failed to delete expense" };
  }
}

// ─── Get Expenses for an Order ────────────────────────────────────────────────

export async function getOrderExpenses(
  orderId: string
): Promise<
  ActionResult<
    {
      _id: string;
      category: string;
      amount: number;
      note: string;
      date: string;
      addedBy: { name: string };
    }[]
  >
> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const expenses = await OrderExpense.find({
      userId: tenantId,
      orderId,
    })
      .populate("addedBy", "name")
      .sort({ date: -1 })
      .lean();

    return {
      success: true,
      data: expenses.map((e: any) => ({
        _id: e._id.toString(),
        category: e.category,
        amount: e.amount,
        note: e.note || "",
        date: new Date(e.date).toISOString(),
        addedBy: { name: e.addedBy?.name || "Staff" },
      })),
    };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch expenses" };
  }
}
