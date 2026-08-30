"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Expense } from "@/models/Expense";
import { expenseSchema, ExpenseInput } from "@/lib/validators/expense";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getTenantId } from "@/lib/tenant";

export async function getExpenses(filter: {
  category?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<ActionResult<any>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    const role = (session.user as any).role;
    if (role !== "admin") {
      return { success: false, error: "Access denied. Admin rights required." };
    }

    await connectDB();

    const query: Record<string, unknown> = { userId: tenantId };

    if (filter.category && filter.category !== "ALL") {
      query.category = filter.category;
    }

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) {
        (query.date as any).$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        (query.date as any).$lte = end;
      }
    }

    const expenses = await Expense.find(query)
      .populate("addedBy", "name email")
      .sort({ date: -1 })
      .lean();

    // Category summary aggregation
    const categoryTotalsAgg = await Expense.aggregate([
      { $match: query },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]);

    const categoryTotals: Record<string, number> = {};
    let totalExpenses = 0;
    categoryTotalsAgg.forEach((item: any) => {
      categoryTotals[item._id] = item.total;
      totalExpenses += item.total;
    });

    const formatted = expenses.map((e: any) => ({
      _id: e._id.toString(),
      category: e.category,
      amount: e.amount,
      note: e.note || "",
      date: new Date(e.date).toISOString(),
      addedBy: e.addedBy ? { name: e.addedBy.name, email: e.addedBy.email } : { name: "Admin" },
    }));

    return {
      success: true,
      data: {
        expenses: formatted,
        categoryTotals,
        totalExpenses,
      },
    };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
}

export async function createExpense(input: ExpenseInput): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user?.id || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }
    const userId = session.user.id;

    const role = (session.user as any).role;
    if (role !== "admin") {
      return { success: false, error: "Only admins can record expenses" };
    }

    const validated = expenseSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid expense input",
      };
    }

    await connectDB();

    const newExpense = await Expense.create({
      userId: tenantId,
      category: validated.data.category,
      amount: validated.data.amount,
      note: validated.data.note || "",
      date: new Date(validated.data.date),
      addedBy: new mongoose.Types.ObjectId(userId),
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: newExpense._id.toString() };
  } catch (error) {
    return { success: false, error: "Failed to log expense" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    const role = (session.user as any).role;
    if (role !== "admin") {
      return { success: false, error: "Only admins can delete expense entries" };
    }

    await connectDB();

    const deleted = await Expense.findOneAndDelete({ _id: id, userId: tenantId });
    if (!deleted) {
      return { success: false, error: "Expense entry not found" };
    }

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: "Expense entry deleted successfully" };
  } catch (error) {
    return { success: false, error: "Failed to delete expense entry" };
  }
}
