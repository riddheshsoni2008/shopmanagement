"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { OrderExpense } from "@/models/OrderExpense";
import { Client } from "@/models/Client";
import { getTenantId } from "@/lib/tenant";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import type { BusinessCategory } from "@/lib/category-config";
import type { OrderStatus } from "@/models/Order";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderFormInput {
  clientId?: string;
  clientName: string;
  clientPhone: string;
  businessCategory: "studio" | "clothing";
  orderType: string;
  orderDate: string;
  dueDate?: string;
  status?: OrderStatus;
  agreedAmount: number;
  advanceReceived: number;
  description?: string;
  // studio extra
  photographerName?: string;
  photographerId?: string;
  venueAddress?: string;
  // clothing extra
  measurementNotes?: string;
  fabricDetails?: string;
}

export interface OrderSummary {
  _id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  clientId: string;
  orderType: string;
  orderDate: string;
  dueDate: string | null;
  status: OrderStatus;
  agreedAmount: number;
  advanceReceived: number;
  balanceDue: number;
  totalExpenses: number;
  profit: number;
  businessCategory: string;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  description: string;
  studioExtra?: {
    photographerName: string;
    venueAddress: string;
  };
  clothingExtra?: {
    measurementNotes: string;
    fabricDetails: string;
  };
  expenses: {
    _id: string;
    category: string;
    amount: number;
    note: string;
    date: string;
    addedBy: { name: string };
  }[];
}

export interface OrderDashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: OrderSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOrderNumber(cat: "studio" | "clothing"): string {
  const prefix = cat === "studio" ? "STU" : "CLT";
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${rand}`;
}

function formatOrder(o: any, expenses: any[] = []): OrderSummary {
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const balanceDue = Math.max(0, o.agreedAmount - o.advanceReceived);
  return {
    _id: o._id.toString(),
    orderNumber: o.orderNumber,
    clientName: o.clientName,
    clientPhone: o.clientPhone,
    clientId: o.clientId?.toString() || "",
    orderType: o.orderType,
    orderDate: new Date(o.orderDate).toISOString(),
    dueDate: o.dueDate ? new Date(o.dueDate).toISOString() : null,
    status: o.status,
    agreedAmount: o.agreedAmount,
    advanceReceived: o.advanceReceived,
    balanceDue,
    totalExpenses,
    profit: o.agreedAmount - totalExpenses,
    businessCategory: o.businessCategory,
    createdAt: new Date(o.createdAt).toISOString(),
  };
}

// ─── Create Order ─────────────────────────────────────────────────────────────

export async function createOrder(
  input: OrderFormInput
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user?.id || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    if (!input.clientName?.trim() || !input.clientPhone?.trim()) {
      return { success: false, error: "Client name and phone are required" };
    }
    if (!input.orderType?.trim()) {
      return { success: false, error: "Order type is required" };
    }
    if (input.agreedAmount < 0) {
      return { success: false, error: "Agreed amount cannot be negative" };
    }

    await connectDB();

    // Upsert client record
    let clientId = input.clientId
      ? new mongoose.Types.ObjectId(input.clientId)
      : null;

    if (!clientId) {
      const existingClient = await Client.findOne({
        userId: tenantId,
        businessCategory: input.businessCategory,
        phone: input.clientPhone.trim(),
      });
      if (existingClient) {
        clientId = existingClient._id as mongoose.Types.ObjectId;
        // Update name if changed
        if (existingClient.name !== input.clientName.trim()) {
          existingClient.name = input.clientName.trim();
          await existingClient.save();
        }
      } else {
        const newClient = await Client.create({
          userId: tenantId,
          businessCategory: input.businessCategory,
          name: input.clientName.trim(),
          phone: input.clientPhone.trim(),
        });
        clientId = newClient._id as mongoose.Types.ObjectId;
      }
    }

    // Generate unique order number (retry on collision)
    let orderNumber = generateOrderNumber(input.businessCategory);
    let attempts = 0;
    while (attempts < 5) {
      const exists = await Order.findOne({ userId: tenantId, orderNumber });
      if (!exists) break;
      orderNumber = generateOrderNumber(input.businessCategory);
      attempts++;
    }

    const orderData: any = {
      userId: tenantId,
      businessCategory: input.businessCategory,
      clientId,
      clientName: input.clientName.trim(),
      clientPhone: input.clientPhone.trim(),
      orderNumber,
      orderType: input.orderType.trim(),
      orderDate: new Date(input.orderDate),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: input.status || "received",
      agreedAmount: input.agreedAmount,
      advanceReceived: input.advanceReceived || 0,
      description: input.description?.trim() || "",
    };

    if (input.businessCategory === "studio") {
      orderData.studioExtra = {
        photographerName: input.photographerName?.trim() || "",
        photographerId: input.photographerId
          ? new mongoose.Types.ObjectId(input.photographerId)
          : null,
        venueAddress: input.venueAddress?.trim() || "",
      };
    }

    if (input.businessCategory === "clothing") {
      orderData.clothingExtra = {
        measurementNotes: input.measurementNotes?.trim() || "",
        fabricDetails: input.fabricDetails?.trim() || "",
      };
    }

    const newOrder = await Order.create(orderData);

    revalidatePath(`/dashboard/${input.businessCategory}/orders`);
    revalidatePath(`/dashboard/${input.businessCategory}/dashboard`);

    return {
      success: true,
      data: { orderId: newOrder._id.toString(), orderNumber: newOrder.orderNumber },
    };
  } catch (error: any) {
    console.error("createOrder error:", error);
    return { success: false, error: error.message || "Failed to create order" };
  }
}

// ─── Get Orders (paginated) ────────────────────────────────────────────────────

export async function getOrders(
  businessCategory: "studio" | "clothing",
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}
): Promise<ActionResult<{ orders: OrderSummary[]; total: number; totalPages: number; page: number }>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { userId: tenantId, businessCategory };

    if (options.status && options.status !== "all") {
      query.status = options.status;
    }

    if (options.search?.trim()) {
      const q = options.search.trim();
      query.$or = [
        { clientName: { $regex: q, $options: "i" } },
        { clientPhone: { $regex: q, $options: "i" } },
        { orderNumber: { $regex: q, $options: "i" } },
        { orderType: { $regex: q, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    const orderIds = orders.map((o: any) => o._id);
    const expenses = await OrderExpense.find({
      userId: tenantId,
      orderId: { $in: orderIds },
    }).lean();

    const expensesByOrder: Record<string, any[]> = {};
    for (const e of expenses) {
      const key = (e.orderId as any).toString();
      if (!expensesByOrder[key]) expensesByOrder[key] = [];
      expensesByOrder[key].push(e);
    }

    const formatted = orders.map((o: any) =>
      formatOrder(o, expensesByOrder[o._id.toString()] || [])
    );

    return {
      success: true,
      data: {
        orders: formatted,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error: any) {
    console.error("getOrders error:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

// ─── Get Order By ID ──────────────────────────────────────────────────────────

export async function getOrderById(
  id: string
): Promise<ActionResult<OrderDetail>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const order = await Order.findOne({ _id: id, userId: tenantId }).lean();
    if (!order) return { success: false, error: "Order not found" };

    const expenses = await OrderExpense.find({
      userId: tenantId,
      orderId: order._id,
    })
      .populate("addedBy", "name")
      .sort({ date: -1 })
      .lean();

    const summary = formatOrder(order, expenses);
    const detail: OrderDetail = {
      ...summary,
      description: (order as any).description || "",
      studioExtra: (order as any).studioExtra
        ? {
            photographerName: (order as any).studioExtra.photographerName || "",
            venueAddress: (order as any).studioExtra.venueAddress || "",
          }
        : undefined,
      clothingExtra: (order as any).clothingExtra
        ? {
            measurementNotes: (order as any).clothingExtra.measurementNotes || "",
            fabricDetails: (order as any).clothingExtra.fabricDetails || "",
          }
        : undefined,
      expenses: expenses.map((e: any) => ({
        _id: e._id.toString(),
        category: e.category,
        amount: e.amount,
        note: e.note || "",
        date: new Date(e.date).toISOString(),
        addedBy: { name: e.addedBy?.name || "Staff" },
      })),
    };

    return { success: true, data: detail };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch order details" };
  }
}

// ─── Update Order Status ──────────────────────────────────────────────────────

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const order = await Order.findOneAndUpdate(
      { _id: id, userId: tenantId },
      { status },
      { new: true }
    );
    if (!order) return { success: false, error: "Order not found" };

    revalidatePath(`/dashboard/${order.businessCategory}/orders`);
    revalidatePath(`/dashboard/${order.businessCategory}/orders/${id}`);
    revalidatePath(`/dashboard/${order.businessCategory}/dashboard`);

    return { success: true, data: "Status updated" };
  } catch (error: any) {
    return { success: false, error: "Failed to update status" };
  }
}

// ─── Update Order ─────────────────────────────────────────────────────────────

export async function updateOrder(
  id: string,
  input: Partial<OrderFormInput>
): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const existing = await Order.findOne({ _id: id, userId: tenantId });
    if (!existing) return { success: false, error: "Order not found" };

    const updates: any = {};
    if (input.orderType) updates.orderType = input.orderType.trim();
    if (input.orderDate) updates.orderDate = new Date(input.orderDate);
    if (input.dueDate !== undefined)
      updates.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.status) updates.status = input.status;
    if (input.agreedAmount !== undefined) updates.agreedAmount = input.agreedAmount;
    if (input.advanceReceived !== undefined)
      updates.advanceReceived = input.advanceReceived;
    if (input.description !== undefined)
      updates.description = input.description.trim();

    if (existing.businessCategory === "studio") {
      updates.studioExtra = {
        photographerName: input.photographerName?.trim() || existing.studioExtra?.photographerName || "",
        venueAddress: input.venueAddress?.trim() || existing.studioExtra?.venueAddress || "",
      };
    }

    if (existing.businessCategory === "clothing") {
      updates.clothingExtra = {
        measurementNotes: input.measurementNotes?.trim() || existing.clothingExtra?.measurementNotes || "",
        fabricDetails: input.fabricDetails?.trim() || existing.clothingExtra?.fabricDetails || "",
      };
    }

    await Order.findOneAndUpdate({ _id: id, userId: tenantId }, updates);

    revalidatePath(`/dashboard/${existing.businessCategory}/orders`);
    revalidatePath(`/dashboard/${existing.businessCategory}/orders/${id}`);
    revalidatePath(`/dashboard/${existing.businessCategory}/dashboard`);

    return { success: true, data: "Order updated successfully" };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order" };
  }
}

// ─── Delete Order ─────────────────────────────────────────────────────────────

export async function deleteOrder(id: string): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) return { success: false, error: "Unauthorized access" };

    if ((session.user as any).role !== "admin") {
      return { success: false, error: "Only admins can delete orders" };
    }

    await connectDB();

    const order = await Order.findOne({ _id: id, userId: tenantId });
    if (!order) return { success: false, error: "Order not found" };

    const cat = order.businessCategory;

    await Promise.all([
      Order.deleteOne({ _id: id }),
      OrderExpense.deleteMany({ orderId: id, userId: tenantId }),
    ]);

    revalidatePath(`/dashboard/${cat}/orders`);
    revalidatePath(`/dashboard/${cat}/dashboard`);

    return { success: true, data: "Order deleted" };
  } catch (error: any) {
    return { success: false, error: "Failed to delete order" };
  }
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export interface OrderDashboardFilterOptions {
  period?: "today" | "month" | "year" | "all";
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getOrderDashboardMetrics(
  businessCategory: "studio" | "clothing",
  options: OrderDashboardFilterOptions = {}
): Promise<ActionResult<OrderDashboardMetrics & { period: string; status: string }>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const now = new Date();
    const period = options.period || "month";
    let start: Date | null = null;
    let end: Date = options.endDate ? new Date(options.endDate) : now;
    end.setHours(23, 59, 59, 999);

    if (options.startDate) {
      start = new Date(options.startDate);
    } else if (period === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (period === "all") {
      start = null;
    }

    const matchQuery: Record<string, any> = {
      userId: tenantId,
      businessCategory,
    };

    if (start) {
      matchQuery.createdAt = { $gte: start, $lte: end };
    }

    if (options.status && options.status !== "all") {
      matchQuery.status = options.status;
    }

    const [aggTotals, recentOrders, expenseAgg, statusAgg, recentExpAgg] = await Promise.all([
      Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$agreedAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      Order.find(matchQuery).sort({ createdAt: -1 }).limit(8).lean(),
      OrderExpense.aggregate([
        {
          $match: {
            userId: tenantId,
            businessCategory,
            ...(start ? { date: { $gte: start, $lte: end } } : {}),
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Order.aggregate([
        { $match: { userId: tenantId, businessCategory } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      OrderExpense.aggregate([
        {
          $match: {
            userId: tenantId,
            businessCategory,
          },
        },
        { $group: { _id: "$orderId", total: { $sum: "$amount" } } },
      ]),
    ]);

    const expMap: Record<string, number> = {};
    for (const e of recentExpAgg) {
      expMap[e._id.toString()] = e.total;
    }

    const totalRevenue = aggTotals[0]?.totalRevenue || 0;
    const totalOrders = aggTotals[0]?.totalOrders || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const totalProfit = totalRevenue - totalExpenses;

    const statusMap: Record<string, number> = {};
    for (const s of statusAgg) {
      statusMap[s._id] = s.count;
    }

    const formattedRecent = recentOrders.map((o: any) =>
      formatOrder(o, [{ amount: expMap[o._id.toString()] || 0 }])
    );

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        totalProfit,
        totalOrders,
        pendingOrders:
          (statusMap["received"] || 0) + (statusMap["in_progress"] || 0),
        completedOrders:
          (statusMap["completed"] || 0) + (statusMap["delivered"] || 0),
        recentOrders: formattedRecent,
        period,
        status: options.status || "all",
      },
    };
  } catch (error: any) {
    console.error("getOrderDashboardMetrics error:", error);
    return { success: false, error: "Failed to load dashboard metrics" };
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getOrderReportData(
  businessCategory: "studio" | "clothing",
  startDateStr?: string,
  endDateStr?: string
): Promise<
  ActionResult<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalOrders: number;
    ordersByStatus: { status: string; count: number }[];
    ordersByType: { type: string; revenue: number; count: number }[];
    expensesByCategory: { category: string; amount: number }[];
    revenueTrend: { date: string; revenue: number; count: number }[];
  }>
> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(now.getDate() - 30);
    defaultStart.setHours(0, 0, 0, 0);

    const start = startDateStr ? new Date(startDateStr) : defaultStart;
    const end = endDateStr ? new Date(endDateStr) : now;
    end.setHours(23, 59, 59, 999);

    const [ordersByType, ordersByStatus, expensesByCategory, revenueTrend, totalExpAgg] =
      await Promise.all([
        Order.aggregate([
          {
            $match: {
              userId: tenantId,
              businessCategory,
              orderDate: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: "$orderType",
              revenue: { $sum: "$agreedAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { revenue: -1 } },
        ]),
        Order.aggregate([
          { $match: { userId: tenantId, businessCategory } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        OrderExpense.aggregate([
          {
            $match: {
              userId: tenantId,
              businessCategory,
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: "$category", amount: { $sum: "$amount" } } },
          { $sort: { amount: -1 } },
        ]),
        Order.aggregate([
          {
            $match: {
              userId: tenantId,
              businessCategory,
              orderDate: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$orderDate" },
              },
              revenue: { $sum: "$agreedAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        OrderExpense.aggregate([
          {
            $match: {
              userId: tenantId,
              businessCategory,
              date: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    const totalRevenue = ordersByType.reduce((s: number, o: any) => s + o.revenue, 0);
    const totalExpenses = totalExpAgg[0]?.total || 0;

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalOrders: ordersByType.reduce((s: number, o: any) => s + o.count, 0),
        ordersByStatus: ordersByStatus.map((s: any) => ({
          status: s._id,
          count: s.count,
        })),
        ordersByType: ordersByType.map((o: any) => ({
          type: o._id,
          revenue: o.revenue,
          count: o.count,
        })),
        expensesByCategory: expensesByCategory.map((e: any) => ({
          category: e._id,
          amount: e.amount,
        })),
        revenueTrend: revenueTrend.map((r: any) => ({
          date: r._id,
          revenue: r.revenue,
          count: r.count,
        })),
      },
    };
  } catch (error: any) {
    console.error("getOrderReportData error:", error);
    return { success: false, error: "Failed to fetch report data" };
  }
}
