import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: "admin" | "staff";
  }

  interface Session {
    user: {
      id: string;
      role?: "admin" | "staff";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "staff";
  }
}
