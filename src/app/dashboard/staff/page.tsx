import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { StaffDashboardView } from "./staff-dashboard-view";

export default async function StaffDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    totalAppointments,
    pendingAppointments,
    pendingWalkins,
    todayAppointments,
  ] = await Promise.all([
    prisma.appointment.count({ where: { recipientId: userId } }),
    prisma.appointment.count({ where: { recipientId: userId, status: "PENDING" } }),
    prisma.walkInRequest.count({ where: { recipientId: userId, decision: "PENDING" } }),
    prisma.appointment.count({
      where: {
        recipientId: userId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
  ]);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      recipientId: userId,
      status: { in: ["APPROVED", "PENDING"] },
      date: { gte: new Date() },
    },
    include: { visitor: true },
    orderBy: { date: "asc" },
    take: 5,
  });

  const appointments = upcomingAppointments.map((apt) => ({
    id: apt.id,
    visitorName: `${apt.visitor.firstName} ${apt.visitor.lastName}`,
    purpose: apt.purpose,
    date: apt.date.toISOString(),
    startTime: apt.startTime.toISOString(),
    status: apt.status,
  }));

  return (
    <StaffDashboardView
      stats={{ totalAppointments, pendingAppointments, pendingWalkins, todayAppointments }}
      appointments={appointments}
    />
  );
}
