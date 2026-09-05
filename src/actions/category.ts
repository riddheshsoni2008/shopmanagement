"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getTenantId } from "@/lib/tenant";
import { ActionResult } from "@/actions/auth";
import { revalidatePath } from "next/cache";
import type { BusinessCategory } from "@/lib/category-config";

export async function setBusinessCategory(
  category: BusinessCategory
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    const tenantId = await getTenantId();
    if (!tenantId) return { success: false, error: "Unauthorized access" };
    if (!session?.user?.id || !tenantId) return { success: false, error: "Unauthorized access" };

    if (!["jewelry", "studio", "clothing"].includes(category)) {
      return { success: false, error: "Invalid business category" };
    }

    await connectDB();

    await User.findByIdAndUpdate(tenantId, { businessCategory: category });
    await Promise.all([
      User.findByIdAndUpdate(session.user.id, { businessCategory: category }),
      User.findByIdAndUpdate(tenantId, { businessCategory: category }),
    ]);

    revalidatePath("/", "layout");

    return { success: true, data: category };
  } catch (error: any) {
    console.error("setBusinessCategory error:", error);
    return { success: false, error: "Failed to set business category" };
  }
}
