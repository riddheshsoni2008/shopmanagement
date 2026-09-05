import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "jewelry-shop-super-secret-key-32-chars-min",
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnSelectCategory = nextUrl.pathname.startsWith("/select-category");

      if (isOnLogin) {
        if (isLoggedIn) {
          const cat = (auth?.user as any)?.businessCategory;
          const dest =
            cat === "studio"
              ? "/dashboard/studio/dashboard"
              : cat === "clothing"
              ? "/dashboard/clothing/dashboard"
              : "/dashboard";
          return Response.redirect(new URL(dest, nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      // Allow select-category page for authenticated users
      if (isOnSelectCategory) {
        return true;
      }

      const userRole = (auth?.user as any)?.role;
      const cat = (auth?.user as any)?.businessCategory;

      // Role check for admin-only pages (apply to all category prefixes)
      const adminOnlySegments = ["/expenses", "/reports", "/settings"];
      const isAdminOnlyPath = adminOnlySegments.some((seg) =>
        nextUrl.pathname.includes(seg)
      );

      if (isAdminOnlyPath && userRole !== "admin") {
        const fallback =
          cat === "studio"
            ? "/dashboard/studio/dashboard"
            : cat === "clothing"
            ? "/dashboard/clothing/dashboard"
            : "/dashboard";
        return Response.redirect(new URL(fallback, nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.businessCategory = (user as any).businessCategory ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as "admin" | "staff";
        (session.user as any).businessCategory = token.businessCategory ?? null;
      }
      return session;
    },
  },
  providers: [], // Configured in src/lib/auth.ts
};
