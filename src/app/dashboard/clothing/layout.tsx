import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrderSidebar } from "@/components/layout/order-sidebar";
import { OrderNavbar } from "@/components/layout/order-navbar";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export default async function ClothingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const cat = (session.user as any)?.businessCategory;
  if (cat !== "clothing") {
    if (cat === "studio") redirect("/dashboard/studio/dashboard");
    else redirect("/dashboard");
  }

  await connectDB();
  const userDoc = await User.findById(session.user.id).select("shopName").lean();
  const shopName =
    userDoc?.shopName && !userDoc.shopName.includes("Zeal Jewellers")
      ? userDoc.shopName
      : "Clothing Shop";

  return (
    <div className="flex min-h-screen bg-[#faf8f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-rose-500 selection:text-white transition-colors duration-200">
      <OrderSidebar user={session.user} category="clothing" shopName={shopName} />
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <OrderNavbar user={session.user} category="clothing" shopName={shopName} />
        <main className="flex-1 p-3 sm:p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
