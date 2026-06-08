import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ReportsDashboard } from "./reports-dashboard";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [
    totalAppointments,
    weeklyAppointments,
    monthlyAppointments,
    totalVisitors,
    weeklyVisitors,
    walkIns,
    noShows,
    currentInside,
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.appointment.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.visitorLog.count(),
    prisma.visitorLog.count({ where: { checkInTime: { gte: weekAgo } } }),
    prisma.visitorLog.count({ where: { isWalkIn: true } }),
    prisma.appointment.count({ where: { status: "NO_SHOW" } }),
    prisma.visitorLog.count({ where: { status: "CHECKED_IN" } }),
  ]);

  return (
    <ReportsDashboard
      stats={{ totalAppointments, weeklyAppointments, monthlyAppointments, totalVisitors, weeklyVisitors, walkIns, noShows, currentInside }}
    />
  );
}
