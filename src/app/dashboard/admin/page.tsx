import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Calendar, Users, UserCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, getStatusColor } from "@/lib/utils";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of appointments and visitors</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Total Appointments"
          value={totalAppointments}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPICard
          title="Today's Appointments"
          value={todayAppointments}
          icon={<Clock className="h-4 w-4" />}
        />
        <KPICard
          title="Pending Approval"
          value={pendingAppointments}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KPICard
          title="Currently Inside"
          value={currentVisitors}
          icon={<UserCheck className="h-4 w-4" />}
        />
        <KPICard
          title="Today's Visitors"
          value={totalVisitors}
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          title="Walk-In Requests"
          value={walkInRequests}
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No appointments yet</p>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">
                        {apt.visitor.firstName} {apt.visitor.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        With: {apt.recipient.firstName} {apt.recipient.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(apt.date)} {formatTime(apt.startTime)}
                    </p>
                    <Badge className={getStatusColor(apt.status)}>
                      {apt.status}
                    </Badge>
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
