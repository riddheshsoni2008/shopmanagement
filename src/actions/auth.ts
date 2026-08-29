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
    await signIn("credentials", {
      email: validated.data.email.toLowerCase().trim(),
      password: validated.data.password,
      redirectTo: "/dashboard",
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

    const hashedPassword = await bcrypt.hash(validated.data.password, 10);
    await User.create({
      name: validated.data.name.trim(),
      email: validated.data.email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      role: validated.data.role || "admin",
    });

    return {
      success: true,
      data: "Account created successfully! You can now sign in.",
    };
  } catch (error: any) {
    console.error("Register user error:", error);
    return {
      success: false,
      error: "Unable to connect to server. Please try again in a moment.",
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
