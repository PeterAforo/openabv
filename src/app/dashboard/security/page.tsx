import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SecurityDashboardView } from "./security-dashboard-view";

export default async function SecurityDashboardPage() {
  const session = await auth();
  if (!session?.user || !["SECURITY", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [currentVisitors, todayCheckins, todayCheckouts, pendingWalkins] = await Promise.all([
    prisma.visitorLog.count({ where: { status: "CHECKED_IN" } }),
    prisma.visitorLog.count({ where: { checkInTime: { gte: today, lt: tomorrow } } }),
    prisma.visitorLog.count({ where: { checkOutTime: { gte: today, lt: tomorrow } } }),
    prisma.walkInRequest.count({ where: { decision: "PENDING" } }),
  ]);

  const currentVisitorsList = await prisma.visitorLog.findMany({
    where: { status: "CHECKED_IN" },
    include: { visitor: true },
    orderBy: { checkInTime: "desc" },
    take: 10,
  });

  const visitors = currentVisitorsList.map((log) => ({
    id: log.id,
    name: `${log.visitor.firstName} ${log.visitor.lastName}`,
    purpose: log.purpose,
    checkInTime: log.checkInTime.toISOString(),
    isWalkIn: log.isWalkIn,
  }));

  return (
    <SecurityDashboardView
      stats={{ currentVisitors, todayCheckins, todayCheckouts, pendingWalkins }}
      visitors={visitors}
    />
  );
}
