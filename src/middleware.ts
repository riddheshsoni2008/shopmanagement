import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

// CRITICAL: matcher must be defined INLINE here — Next.js does static analysis
// on this file directly and cannot read it if re-exported from another module.
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - api routes (including auth routes)
     * - _next/static (static files like CSS, JS)
     * - _next/image (image optimization)
     * - _next/data (RSC data fetches)
     * - favicon.ico
     * - login page
     * - Any file with an extension (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|_next/data|favicon\\.ico|icon\\.svg|login|.*\\..*).*)$",
  ],
};
