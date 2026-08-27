"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema, LoginInput } from "@/lib/validators/auth";
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
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });
    return { success: true, data: "Logged in successfully" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          return { success: false, error: "Authentication failed" };
      }
    }
    return { success: false, error: "An unexpected error occurred during login" };
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
