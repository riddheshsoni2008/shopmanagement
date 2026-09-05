"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Equipment } from "@/models/Equipment";
import { getTenantId } from "@/lib/tenant";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import type { EquipmentType, EquipmentOwnership, EquipmentCondition } from "@/models/Equipment";

export interface EquipmentFormInput {
  name: string;
  type: EquipmentType;
  ownership: EquipmentOwnership;
  purchaseDate?: string;
  rentalExpiryDate?: string;
  serviceNextDue?: string;
  condition: EquipmentCondition;
  notes?: string;
}

export interface EquipmentSummary {
  _id: string;
  name: string;
  type: string;
  ownership: string;
  purchaseDate: string | null;
  rentalExpiryDate: string | null;
  serviceNextDue: string | null;
  condition: string;
  notes: string;
  isServiceDueSoon: boolean;
  createdAt: string;
}

function formatEquipment(e: any): EquipmentSummary {
  const today = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(today.getDate() + 30);
  const serviceDue = e.serviceNextDue ? new Date(e.serviceNextDue) : null;
  const isServiceDueSoon = serviceDue ? serviceDue <= thirtyDays : false;

  return {
    _id: e._id.toString(),
    name: e.name,
    type: e.type,
    ownership: e.ownership,
    purchaseDate: e.purchaseDate ? new Date(e.purchaseDate).toISOString() : null,
    rentalExpiryDate: e.rentalExpiryDate
      ? new Date(e.rentalExpiryDate).toISOString()
      : null,
    serviceNextDue: e.serviceNextDue
      ? new Date(e.serviceNextDue).toISOString()
      : null,
    condition: e.condition,
    notes: e.notes || "",
    isServiceDueSoon,
    createdAt: new Date(e.createdAt).toISOString(),
  };
}

// ─── Get Equipment ────────────────────────────────────────────────────────────

export async function getEquipment(
  options: {
    search?: string;
    condition?: string;
    type?: string;
  } = {}
): Promise<ActionResult<EquipmentSummary[]>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const query: Record<string, any> = { userId: tenantId };
    if (options.condition && options.condition !== "all") {
      query.condition = options.condition;
    }
    if (options.type && options.type !== "all") {
      query.type = options.type;
    }
    if (options.search?.trim()) {
      query.name = { $regex: options.search.trim(), $options: "i" };
    }

    const items = await Equipment.find(query).sort({ createdAt: -1 }).lean();

    return { success: true, data: items.map(formatEquipment) };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch equipment" };
  }
}

// ─── Create Equipment ─────────────────────────────────────────────────────────

export async function createEquipment(
  input: EquipmentFormInput
): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    if (!input.name?.trim()) {
      return { success: false, error: "Equipment name is required" };
    }

    await connectDB();

    const item = await Equipment.create({
      userId: tenantId,
      name: input.name.trim(),
      type: input.type,
      ownership: input.ownership,
      condition: input.condition || "good",
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      rentalExpiryDate: input.rentalExpiryDate
        ? new Date(input.rentalExpiryDate)
        : null,
      serviceNextDue: input.serviceNextDue
        ? new Date(input.serviceNextDue)
        : null,
      notes: input.notes?.trim() || "",
    });

    revalidatePath("/dashboard/studio/equipment");

    return { success: true, data: item._id.toString() };
  } catch (error: any) {
    return { success: false, error: "Failed to add equipment" };
  }
}

// ─── Update Equipment ─────────────────────────────────────────────────────────

export async function updateEquipment(
  id: string,
  input: Partial<EquipmentFormInput>
): Promise<ActionResult<string>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };

    await connectDB();

    const updates: any = {};
    if (input.name) updates.name = input.name.trim();
    if (input.type) updates.type = input.type;
    if (input.ownership) updates.ownership = input.ownership;
    if (input.condition) updates.condition = input.condition;
    if (input.notes !== undefined) updates.notes = input.notes.trim();
    if (input.purchaseDate !== undefined)
      updates.purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : null;
    if (input.rentalExpiryDate !== undefined)
      updates.rentalExpiryDate = input.rentalExpiryDate
        ? new Date(input.rentalExpiryDate)
        : null;
    if (input.serviceNextDue !== undefined)
      updates.serviceNextDue = input.serviceNextDue
        ? new Date(input.serviceNextDue)
        : null;

    const item = await Equipment.findOneAndUpdate(
      { _id: id, userId: tenantId },
      updates,
      { new: true }
    );
    if (!item) return { success: false, error: "Equipment item not found" };

    revalidatePath("/dashboard/studio/equipment");

    return { success: true, data: "Equipment updated" };
  } catch (error: any) {
    return { success: false, error: "Failed to update equipment" };
  }
}

// ─── Delete Equipment ─────────────────────────────────────────────────────────

export async function deleteEquipment(
  id: string
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user || !tenantId) return { success: false, error: "Unauthorized access" };

    if ((session.user as any).role !== "admin") {
      return { success: false, error: "Only admins can delete equipment" };
    }

    await connectDB();

    const item = await Equipment.findOneAndDelete({ _id: id, userId: tenantId });
    if (!item) return { success: false, error: "Equipment item not found" };

    revalidatePath("/dashboard/studio/equipment");

    return { success: true, data: "Equipment deleted" };
  } catch (error: any) {
    return { success: false, error: "Failed to delete equipment" };
  }
}
