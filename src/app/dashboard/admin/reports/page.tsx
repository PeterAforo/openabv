import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Users, Calendar, UserCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">System-wide statistics and reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Appointments" value={totalAppointments} icon={<Calendar className="h-4 w-4" />} />
        <KPICard title="This Week" value={weeklyAppointments} icon={<Clock className="h-4 w-4" />} description="Appointments this week" />
        <KPICard title="This Month" value={monthlyAppointments} icon={<CheckCircle className="h-4 w-4" />} description="Appointments this month" />
        <KPICard title="Currently Inside" value={currentInside} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Visitor Logs" value={totalVisitors} icon={<UserCheck className="h-4 w-4" />} />
        <KPICard title="Weekly Visitors" value={weeklyVisitors} icon={<Users className="h-4 w-4" />} />
        <KPICard title="Walk-Ins" value={walkIns} icon={<AlertTriangle className="h-4 w-4" />} description="Total walk-in visitors" />
        <KPICard title="No-Shows" value={noShows} icon={<AlertTriangle className="h-4 w-4" />} description="Missed appointments" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Detailed charts and export functionality will be available in the next release.
              Current data can be viewed through Prisma Studio.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Visitor Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Department-level visitor statistics, peak hours analysis, and CSV export
              coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
