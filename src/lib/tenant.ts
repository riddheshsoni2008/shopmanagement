import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import { Expense } from "@/models/Expense";
import mongoose from "mongoose";

let legacyBackfilled = false;

export async function getTenantId(): Promise<mongoose.Types.ObjectId | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userObjId = new mongoose.Types.ObjectId(session.user.id);

  await connectDB();

  // Perform a one-time backfill for legacy items created before multi-tenancy
  if (!legacyBackfilled) {
    try {
      const firstAdmin = await User.findOne({ role: "admin" })
        .sort({ createdAt: 1 })
        .lean();
      if (firstAdmin) {
        const firstAdminId = firstAdmin._id;
        await Promise.all([
          Product.updateMany(
            { userId: { $exists: false } },
            { $set: { userId: firstAdminId } },
          ),
          Sale.updateMany(
            { userId: { $exists: false } },
            { $set: { userId: firstAdminId } },
          ),
          Expense.updateMany(
            { userId: { $exists: false } },
            { $set: { userId: firstAdminId } },
          ),
        ]);
      }
      legacyBackfilled = true;
    } catch (e) {
      console.error("Backfill legacy tenant error:", e);
    }
  }

  const user = await User.findById(userObjId).select("ownerId role").lean();

  if (user && user.role === "staff") {
    if (user.ownerId) {
      const ownerExists = await User.exists({ _id: user.ownerId });
      if (ownerExists) {
        return user.ownerId as mongoose.Types.ObjectId;
      }
    }
    // Fallback: If staff has no ownerId or owner was removed, use shop's primary Admin ID
    const firstAdmin = await User.findOne({ role: "admin" })
      .sort({ createdAt: 1 })
      .select("_id")
      .lean();
    if (firstAdmin) {
      return firstAdmin._id as mongoose.Types.ObjectId;
    }
  }

  return userObjId;
}
