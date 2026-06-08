import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminDashboardClient } from "./dashboard-client";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    todayAppointments,
    pendingAppointments,
    currentVisitors,
    totalVisitors,
    walkInRequests,
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({
      where: { date: { gte: today, lt: tomorrow } },
    }),
    prisma.appointment.count({
      where: { status: "PENDING" },
    }),
    prisma.visitorLog.count({
      where: { status: "CHECKED_IN" },
    }),
    prisma.visitorLog.count({
      where: { checkInTime: { gte: today } },
    }),
    prisma.walkInRequest.count({
      where: { decision: "PENDING" },
    }),
  ]);

  const recentAppointments = await prisma.appointment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      visitor: true,
      recipient: true,
    },
  });

  return (
    <AdminDashboardClient
      stats={{ totalAppointments, todayAppointments, pendingAppointments, currentVisitors, totalVisitors, walkInRequests }}
      recentAppointments={recentAppointments.map((apt) => ({
        id: apt.id,
        visitorName: `${apt.visitor.firstName} ${apt.visitor.lastName}`,
        recipientName: `${apt.recipient.firstName} ${apt.recipient.lastName}`,
        date: apt.date.toISOString(),
        startTime: apt.startTime.toISOString(),
        status: apt.status,
      }))}
    />
  );
}
