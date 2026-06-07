import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Calendar, UserCheck, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">Your appointments and visitor requests</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Appointments"
          value={totalAppointments}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPICard
          title="Pending Approval"
          value={pendingAppointments}
          icon={<Clock className="h-4 w-4" />}
        />
        <KPICard
          title="Walk-In Requests"
          value={pendingWalkins}
          icon={<UserCheck className="h-4 w-4" />}
        />
        <KPICard
          title="Today's Meetings"
          value={todayAppointments}
          icon={<MessageSquare className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {apt.visitor.firstName} {apt.visitor.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{apt.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(apt.date)} {formatTime(apt.startTime)}
                    </p>
                    <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
