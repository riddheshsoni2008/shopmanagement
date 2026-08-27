import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Aura Jewelry Shop Manager",
  description:
    "Premium full-stack jewelry shop management system — track stock, process sales, manage expenses, and view real-time analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
