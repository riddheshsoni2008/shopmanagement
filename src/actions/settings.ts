"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Rate } from "@/models/Rate";
import { rateSchema, RateInput } from "@/lib/validators/rate";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export interface RateSettingsData {
  _id: string;
  goldRate22k: number;
  goldRate18k: number;
  silverRate: number;
  shopName: string;
  updatedAt: string;
  updatedBy?: { name: string; email: string };
}

// In-Memory Serverless Caching for Shop Rates to eliminate Layout DB Latency
let cachedRateData: RateSettingsData | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000; // 60 seconds memory cache

export async function getRateSettings(): Promise<ActionResult<RateSettingsData>> {
  try {
    const now = Date.now();
    if (cachedRateData && now - lastCacheTime < CACHE_TTL_MS) {
      return { success: true, data: cachedRateData };
    }

    await connectDB();

    let rate = await Rate.findOne().populate("updatedBy", "name email").lean();

    if (!rate) {
      // Create default rate settings document if none exists yet
      await Rate.create({
        goldRate22k: 7200,
        goldRate18k: 5900,
        silverRate: 85,
        shopName: "Aura Luxury Jewelers",
      });
      rate = await Rate.findOne().populate("updatedBy", "name email").lean();
    }

    if (!rate) {
      return { success: false, error: "Failed to initialize rate settings" };
    }

    const formatted: RateSettingsData = {
      _id: rate._id.toString(),
      goldRate22k: rate.goldRate22k,
      goldRate18k: rate.goldRate18k,
      silverRate: rate.silverRate,
      shopName: rate.shopName || "Aura Luxury Jewelers",
      updatedAt: rate.updatedAt ? new Date(rate.updatedAt).toISOString() : new Date().toISOString(),
      updatedBy: rate.updatedBy
        ? { name: (rate.updatedBy as any).name, email: (rate.updatedBy as any).email }
        : undefined,
    };

    cachedRateData = formatted;
    lastCacheTime = now;

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error fetching rate settings:", error);
    return { success: false, error: "Failed to fetch rate settings" };
  }
}

export async function updateRateSettings(
  input: RateInput
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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

    const existingRate = await Rate.findOne();

    if (existingRate) {
      existingRate.goldRate22k = validated.data.goldRate22k;
      existingRate.goldRate18k = validated.data.goldRate18k;
      existingRate.silverRate = validated.data.silverRate;
      existingRate.shopName = validated.data.shopName;
      existingRate.updatedBy = new mongoose.Types.ObjectId(userId);
      await existingRate.save();
    } else {
      await Rate.create({
        ...validated.data,
        updatedBy: new mongoose.Types.ObjectId(userId),
      });
    }

    // Invalidate memory cache on rate updates
    cachedRateData = null;
    lastCacheTime = 0;

    revalidatePath("/settings");
    revalidatePath("/sales/new");
    revalidatePath("/dashboard");

    return { success: true, data: "Rate settings updated successfully" };
  } catch (error) {
    console.error("Error updating rate settings:", error);
    return { success: false, error: "Failed to update rate settings" };
  }
}
