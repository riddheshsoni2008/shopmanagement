import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: "admin" | "staff";
    businessCategory?: "jewelry" | "studio" | "clothing" | null;
  }

  interface Session {
    user: {
      id: string;
      role?: "admin" | "staff";
      businessCategory?: "jewelry" | "studio" | "clothing" | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "staff";
    businessCategory?: "jewelry" | "studio" | "clothing" | null;
  }
}
