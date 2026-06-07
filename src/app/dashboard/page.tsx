import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const dashboardPath = getDashboardPath(session.user.role as UserRole);
  redirect(dashboardPath);
}
