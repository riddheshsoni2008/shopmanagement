import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Zeal Jewellers - Shop Manager & POS",
  description:
    "Premium full-stack jewelry shop management system — track stock, process sales, manage expenses, and view real-time analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased bg-[#faf8f5] text-slate-900" suppressHydrationWarning>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
