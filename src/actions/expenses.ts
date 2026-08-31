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

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) {
        const start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
        (query.date as any).$gte = start;
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        (query.date as any).$lte = end;
      }
    }

    const dailyDocs = await Expense.find(query)
      .populate("items.addedBy", "name email")
      .populate("addedBy", "name email")
      .sort({ date: -1 })
      .lean();

    const formattedExpenses: Array<any> = [];
    const categoryTotals: Record<string, number> = {};
    let totalExpenses = 0;

    for (const doc of dailyDocs) {
      const docDate = new Date(doc.date).toISOString();

      if (Array.isArray(doc.items) && doc.items.length > 0) {
        for (const item of doc.items) {
          if (filter.category && filter.category !== "ALL" && item.category !== filter.category) {
            continue;
          }

          const itemAmt = Number(item.amount) || 0;
          categoryTotals[item.category] = (categoryTotals[item.category] || 0) + itemAmt;
          totalExpenses += itemAmt;

          formattedExpenses.push({
            _id: item._id ? item._id.toString() : doc._id.toString(),
            dailyDocId: doc._id.toString(),
            category: item.category,
            amount: itemAmt,
            note: item.note || "",
            date: docDate,
            addedBy: item.addedBy ? { name: (item.addedBy as any).name, email: (item.addedBy as any).email } : { name: "Admin" },
          });
        }
      } else if (doc.category && doc.amount) {
        // Legacy document format fallback
        if (filter.category && filter.category !== "ALL" && doc.category !== filter.category) {
          continue;
        }
        const itemAmt = Number(doc.amount) || 0;
        categoryTotals[doc.category] = (categoryTotals[doc.category] || 0) + itemAmt;
        totalExpenses += itemAmt;

        formattedExpenses.push({
          _id: doc._id.toString(),
          dailyDocId: doc._id.toString(),
          category: doc.category,
          amount: itemAmt,
          note: doc.note || "",
          date: docDate,
          addedBy: doc.addedBy ? { name: (doc.addedBy as any).name, email: (doc.addedBy as any).email } : { name: "Admin" },
        });
      }
    }

    return {
      success: true,
      data: {
        expenses: formattedExpenses,
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

    // Normalize date to start of UTC day so all items logged on the same calendar day group into 1 document
    const rawDate = new Date(validated.data.date);
    const dateStart = new Date(Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate()));

    const newItemId = new mongoose.Types.ObjectId();
    const newItem = {
      _id: newItemId,
      category: validated.data.category,
      amount: validated.data.amount,
      note: validated.data.note || "",
      addedBy: new mongoose.Types.ObjectId(userId),
      createdAt: new Date(),
    };

    // Upsert into single daily document for this tenantId & date
    await Expense.findOneAndUpdate(
      { userId: tenantId, date: dateStart },
      {
        $push: { items: newItem },
        $inc: { totalAmount: validated.data.amount },
      },
      { upsert: true, new: true }
    );

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: newItemId.toString() };
  } catch (error: any) {
    console.error("Error logging expense:", error);
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

    // Try finding daily document containing this item or matching document _id
    const doc = await Expense.findOne({
      userId: tenantId,
      $or: [{ _id: id }, { "items._id": id }],
    });

    if (!doc) {
      return { success: false, error: "Expense entry not found" };
    }

    if (doc._id.toString() === id && (!doc.items || doc.items.length === 0)) {
      // Legacy document deletion
      await Expense.deleteOne({ _id: doc._id });
    } else {
      // Find item in daily document
      const itemIndex = doc.items.findIndex((i: any) => i._id.toString() === id);
      if (itemIndex > -1) {
        const removedItem = doc.items[itemIndex];
        doc.items.splice(itemIndex, 1);
        doc.totalAmount = Math.max(0, doc.totalAmount - removedItem.amount);

        if (doc.items.length === 0) {
          await Expense.deleteOne({ _id: doc._id });
        } else {
          await doc.save();
        }
      } else {
        await Expense.deleteOne({ _id: doc._id });
      }
    }

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: "Expense entry deleted successfully" };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Failed to delete expense entry" };
  }
}

export async function bulkDeleteExpenses(ids: string[]): Promise<ActionResult<{ deletedCount: number }>> {
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

    if (!ids || ids.length === 0) {
      return { success: true, data: { deletedCount: 0 } };
    }

    await connectDB();

    let deletedCount = 0;
    for (const id of ids) {
      const res = await deleteExpense(id);
      if (res.success) {
        deletedCount++;
      }
    }

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return { success: true, data: { deletedCount } };
  } catch (error) {
    console.error("Error bulk deleting expenses:", error);
    return { success: false, error: "Failed to delete expense entries" };
  }
}
