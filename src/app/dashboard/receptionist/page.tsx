import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ReceptionistDashboardView } from "./receptionist-dashboard-view";

export default async function ReceptionistDashboardPage() {
  const session = await auth();
  if (!session?.user || !["RECEPTIONIST", "SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [currentVisitors, todayAppointments, todayCheckins, pendingWalkins] = await Promise.all([
    prisma.visitorLog.count({ where: { status: "CHECKED_IN" } }),
    prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
    prisma.visitorLog.count({ where: { checkInTime: { gte: today, lt: tomorrow } } }),
    prisma.walkInRequest.count({ where: { decision: "PENDING" } }),
  ]);

  return (
    <ReceptionistDashboardView
      currentVisitors={currentVisitors}
      todayAppointments={todayAppointments}
      todayCheckins={todayCheckins}
      pendingWalkins={pendingWalkins}
    />
  );
}
