import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";

export default async function DashboardRootPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let cat = (session.user as any)?.businessCategory;

  if (!cat) {
    await connectDB();
    const user = await User.findById(session.user.id).select("businessCategory").lean();
    if (user?.businessCategory) {
      cat = user.businessCategory;
    }
  }

  if (!cat) {
    redirect("/select-category");
  }

  redirect(`/dashboard/${cat}/dashboard`);
}

