"use server";

import { signIn, signOut } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  loginSchema,
  LoginInput,
  resetPasswordSchema,
  ResetPasswordInput,
  registerSchema,
  RegisterInput,
} from "@/lib/validators/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function loginUser(values: LoginInput): Promise<ActionResult<string>> {
  const validated = loginSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid input data",
    };
  }

  try {
    await connectDB();
    const existingUser = await User.findOne({
      email: validated.data.email.toLowerCase().trim(),
    }).select("businessCategory");

    const targetDashboard = existingUser?.businessCategory
      ? `/dashboard/${existingUser.businessCategory}/dashboard`
      : "/dashboard";

    await signIn("credentials", {
      email: validated.data.email.toLowerCase().trim(),
      password: validated.data.password,
      redirectTo: targetDashboard,
    });
    return { success: true, data: "Logged in successfully" };
  } catch (error: any) {
    // CRITICAL: Re-throw redirect errors FIRST — this is how Next.js 15 handles
    // successful server-side redirects. If we don't re-throw, the redirect is swallowed.
    if (error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password. Please check your credentials." };
    }
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred during login" };
  }
}

export async function resetUserPassword(
  values: ResetPasswordInput
): Promise<ActionResult<string>> {
  const validated = resetPasswordSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid input data",
    };
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: validated.data.email.toLowerCase().trim() });
    if (!user) {
      return {
        success: false,
        error: "No account found matching this email address",
      };
    }

    const hashedPassword = await bcrypt.hash(validated.data.newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();

    return {
      success: true,
      data: "Password set successfully! You can now sign in with your new password.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    };
  }
}

export async function registerUser(
  values: RegisterInput
): Promise<ActionResult<string>> {
  const validated = registerSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid input data",
    };
  }

  try {
    await connectDB();
    const existing = await User.findOne({ email: validated.data.email.toLowerCase().trim() });
    if (existing) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    const defaultShopNames: Record<string, string> = {
      jewelry: "Zeal Jewellers®",
      studio: "Camera Studio",
      clothing: "Clothing Boutique",
    };

    const finalShopName =
      validated.data.shopName?.trim() ||
      defaultShopNames[validated.data.businessCategory] ||
      "Business Shop";

    const hashedPassword = await bcrypt.hash(validated.data.password, 10);
    await User.create({
      name: validated.data.name.trim(),
      email: validated.data.email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      role: validated.data.role || "admin",
      businessCategory: validated.data.businessCategory,
      shopName: finalShopName,
    });

    return {
      success: true,
      data: "Account created successfully! You can now sign in.",
    };
  } catch (error: any) {
    console.error("Register user error:", error?.message || error);
    console.error("Full error details:", JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
    
    // Provide specific error messages based on the type of failure
    const errMsg = error?.message || "";
    
    if (errMsg.includes("ENOTFOUND") || errMsg.includes("querySrv")) {
      return {
        success: false,
        error: "Cannot reach the database server. Please check your internet connection.",
      };
    }
    if (errMsg.includes("Authentication failed") || errMsg.includes("auth")) {
      return {
        success: false,
        error: "Database authentication failed. Please contact admin.",
      };
    }
    if (errMsg.includes("timed out") || errMsg.includes("serverSelectionTimeout")) {
      return {
        success: false,
        error: "Database connection timed out. Your IP may not be whitelisted in MongoDB Atlas.",
      };
    }
    if (errMsg.includes("ECONNREFUSED")) {
      return {
        success: false,
        error: "Database connection refused. Server may be down.",
      };
    }
    if (errMsg.includes("duplicate key") || errMsg.includes("E11000")) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }
    
    return {
      success: false,
      error: `Registration failed: ${errMsg || "Unable to connect to server. Please try again in a moment."}`,
    };
  }
}

export async function logoutUser(): Promise<ActionResult<string>> {
  try {
    await signOut({ redirect: false });
    return { success: true, data: "Logged out successfully" };
  } catch (error) {
    return { success: false, error: "Failed to log out" };
  }
}
