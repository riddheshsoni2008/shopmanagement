"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Rate } from "@/models/Rate";
import { rateSchema, RateInput } from "@/lib/validators/rate";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getTenantId } from "@/lib/tenant";

export interface RateSettingsData {
  _id: string;
  goldRate22k: number;
  goldRate18k: number;
  silverRate: number;
  shopName: string;
  updatedAt: string;
  updatedBy?: { name: string; email: string };
}

// In-Memory Caching per Tenant to eliminate DB latency while maintaining multi-tenant isolation
const cachedRateDataMap = new Map<string, { data: RateSettingsData; time: number }>();
const CACHE_TTL_MS = 60000; // 60 seconds memory cache

export async function getRateSettings(): Promise<ActionResult<RateSettingsData>> {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return { success: false, error: "Unauthorized access" };
    }

    const tenantKey = tenantId.toString();
    const now = Date.now();
    const cached = cachedRateDataMap.get(tenantKey);
    if (cached && now - cached.time < CACHE_TTL_MS) {
      return { success: true, data: cached.data };
    }

    await connectDB();

    let rate = await Rate.findOne({ userId: tenantId }).populate("updatedBy", "name email").lean();

    if (!rate) {
      // Create default rate settings document for this new tenant
      const created = await Rate.create({
        userId: tenantId,
        goldRate22k: 7200,
        goldRate18k: 5900,
        silverRate: 85,
        shopName: "Zeal Jewellers",
      });
      rate = await Rate.findById(created._id).populate("updatedBy", "name email").lean();
    }

    if (!rate) {
      return { success: false, error: "Failed to initialize rate settings" };
    }

    const formatted: RateSettingsData = {
      _id: rate._id.toString(),
      goldRate22k: rate.goldRate22k,
      goldRate18k: rate.goldRate18k,
      silverRate: rate.silverRate,
      shopName: rate.shopName || "Zeal Jewellers",
      updatedAt: rate.updatedAt ? new Date(rate.updatedAt).toISOString() : new Date().toISOString(),
      updatedBy: rate.updatedBy
        ? { name: (rate.updatedBy as any).name, email: (rate.updatedBy as any).email }
        : undefined,
    };

    cachedRateDataMap.set(tenantKey, { data: formatted, time: now });

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error("Error fetching rate settings:", error?.message || error);
    return { success: false, error: `Failed to fetch rate settings: ${error?.message || "Unknown error"}` };
  }
}

export async function updateRateSettings(
  input: RateInput
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!session?.user?.id || !tenantId) {
      return { success: false, error: "Unauthorized access" };
    }
    const userId = session.user.id;

    const role = (session.user as any).role;
    if (role !== "admin") {
      return { success: false, error: "Only admins can update shop rates and settings" };
    }

    const validated = rateSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Invalid rate values",
      };
    }

    await connectDB();

    const existingRate = await Rate.findOne({ userId: tenantId });

    if (existingRate) {
      existingRate.goldRate22k = validated.data.goldRate22k;
      existingRate.goldRate18k = validated.data.goldRate18k;
      existingRate.silverRate = validated.data.silverRate;
      existingRate.shopName = validated.data.shopName;
      existingRate.updatedBy = new mongoose.Types.ObjectId(userId);
      await existingRate.save();
    } else {
      await Rate.create({
        userId: tenantId,
        goldRate22k: validated.data.goldRate22k,
        goldRate18k: validated.data.goldRate18k,
        silverRate: validated.data.silverRate,
        shopName: validated.data.shopName,
        updatedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    if (validated.data.ownerName && validated.data.ownerName.trim()) {
      await User.findByIdAndUpdate(userId, { name: validated.data.ownerName.trim() });
    }

    // Invalidate memory cache for this tenant
    cachedRateDataMap.delete(tenantId.toString());

    revalidatePath("/", "layout");
    revalidatePath("/settings");
    revalidatePath("/sales/new");
    revalidatePath("/sales");
    revalidatePath("/dashboard");

    return { success: true, data: "Rate settings updated successfully" };
  } catch (error) {
    console.error("Error updating rate settings:", error);
    return { success: false, error: "Failed to update rate settings" };
  }
}
