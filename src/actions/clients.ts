"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Client } from "@/models/Client";
import { Order } from "@/models/Order";
import { OrderExpense } from "@/models/OrderExpense";
import { getTenantId } from "@/lib/tenant";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export interface ClientSummary {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  businessCategory: string;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

export interface ClientDetail extends ClientSummary {
  orders: {
    _id: string;
    orderNumber: string;
    orderType: string;
    status: string;
    agreedAmount: number;
    advanceReceived: number;
    balanceDue: number;
    orderDate: string;
    dueDate: string | null;
  }[];
}

// ─── Get Clients ──────────────────────────────────────────────────────────────

export async function getClients(
  businessCategory: "studio" | "clothing",
  options: { search?: string; page?: number; limit?: number } = {}
): Promise<
  ActionResult<{ clients: ClientSummary[]; total: number; totalPages: number; page: number }>
> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { userId: tenantId, businessCategory };
    if (options.search?.trim()) {
      const q = options.search.trim();
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(query),
    ]);

    const clientIds = clients.map((c: any) => c._id);
    const orderAgg = await Order.aggregate([
      { $match: { userId: tenantId, businessCategory, clientId: { $in: clientIds } } },
      {
        $group: {
          _id: "$clientId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$agreedAmount" },
        },
      },
    ]);

    const orderMap: Record<string, { totalOrders: number; totalRevenue: number }> = {};
    for (const o of orderAgg) {
      orderMap[o._id.toString()] = {
        totalOrders: o.totalOrders,
        totalRevenue: o.totalRevenue,
      };
    }

    const formatted: ClientSummary[] = clients.map((c: any) => ({
      _id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      address: c.address || "",
      notes: c.notes || "",
      businessCategory: c.businessCategory,
      totalOrders: orderMap[c._id.toString()]?.totalOrders || 0,
      totalRevenue: orderMap[c._id.toString()]?.totalRevenue || 0,
      createdAt: new Date(c.createdAt).toISOString(),
    }));

    return {
      success: true,
      data: { clients: formatted, total, page, totalPages: Math.ceil(total / limit) || 1 },
    };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch clients" };
  }
}

// ─── Get Client Detail ────────────────────────────────────────────────────────

export async function getClientById(
  id: string
): Promise<ActionResult<ClientDetail>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const client = await Client.findOne({ _id: id, userId: tenantId }).lean();
    if (!client) return { success: false, error: "Client not found" };

    const orders = await Order.find({
      userId: tenantId,
      clientId: client._id,
    })
      .sort({ orderDate: -1 })
      .lean();

    const totalRevenue = orders.reduce((s: number, o: any) => s + o.agreedAmount, 0);

    const formatted: ClientDetail = {
      _id: (client._id as any).toString(),
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      address: client.address || "",
      notes: client.notes || "",
      businessCategory: client.businessCategory,
      totalOrders: orders.length,
      totalRevenue,
      createdAt: new Date(client.createdAt).toISOString(),
      orders: orders.map((o: any) => ({
        _id: o._id.toString(),
        orderNumber: o.orderNumber,
        orderType: o.orderType,
        status: o.status,
        agreedAmount: o.agreedAmount,
        advanceReceived: o.advanceReceived,
        balanceDue: Math.max(0, o.agreedAmount - o.advanceReceived),
        orderDate: new Date(o.orderDate).toISOString(),
        dueDate: o.dueDate ? new Date(o.dueDate).toISOString() : null,
      })),
    };

    return { success: true, data: formatted };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch client details" };
  }
}

// ─── Create Client ────────────────────────────────────────────────────────────

export async function createClient(input: {
  businessCategory: "studio" | "clothing";
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    if (!input.name?.trim() || !input.phone?.trim()) {
      return { success: false, error: "Name and phone are required" };
    }

    await connectDB();

    const existing = await Client.findOne({
      userId: tenantId,
      businessCategory: input.businessCategory,
      phone: input.phone.trim(),
    });
    if (existing) {
      return { success: false, error: "A client with this phone already exists" };
    }

    const client = await Client.create({
      userId: tenantId,
      businessCategory: input.businessCategory,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || "",
      address: input.address?.trim() || "",
      notes: input.notes?.trim() || "",
    });

    revalidatePath(`/dashboard/${input.businessCategory}/clients`);

    return { success: true, data: client._id.toString() };
  } catch (error: any) {
    return { success: false, error: "Failed to create client" };
  }
}

// ─── Update Client ────────────────────────────────────────────────────────────

export async function updateClient(
  id: string,
  input: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }
): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const client = await Client.findOneAndUpdate(
      { _id: id, userId: tenantId },
      {
        ...(input.name && { name: input.name.trim() }),
        ...(input.phone && { phone: input.phone.trim() }),
        ...(input.email !== undefined && { email: input.email.trim() }),
        ...(input.address !== undefined && { address: input.address.trim() }),
        ...(input.notes !== undefined && { notes: input.notes.trim() }),
      },
      { new: true }
    );

    if (!client) return { success: false, error: "Client not found" };

    revalidatePath(`/dashboard/${client.businessCategory}/clients`);
    revalidatePath(`/dashboard/${client.businessCategory}/clients/${id}`);

    return { success: true, data: "Client updated" };
  } catch (error: any) {
    return { success: false, error: "Failed to update client" };
  }
}

// ─── Delete Client ────────────────────────────────────────────────────────────

export async function deleteClient(id: string): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) return { success: false, error: "Unauthorized access" };

    if ((session.user as any).role !== "admin") {
      return { success: false, error: "Only admins can delete clients" };
    }

    await connectDB();

    const client = await Client.findOne({ _id: id, userId: tenantId });
    if (!client) return { success: false, error: "Client not found" };

    const cat = client.businessCategory;
    const orders = await Order.find({ userId: tenantId, clientId: id }).select("_id").lean();
    const orderIds = orders.map((o: any) => o._id);

    await Promise.all([
      Client.deleteOne({ _id: id }),
      Order.deleteMany({ userId: tenantId, clientId: id }),
      OrderExpense.deleteMany({ userId: tenantId, orderId: { $in: orderIds } }),
    ]);

    revalidatePath(`/dashboard/${cat}/clients`);
    revalidatePath(`/dashboard/${cat}/dashboard`);

    return { success: true, data: "Client and associated orders deleted" };
  } catch (error: any) {
    return { success: false, error: "Failed to delete client" };
  }
}
