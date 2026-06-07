import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Users, UserCheck, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, getStatusColor } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
        <p className="text-muted-foreground">Manage visitor check-ins and appointments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Currently Inside"
          value={currentVisitors}
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          title="Today's Check-Ins"
          value={todayCheckins}
          icon={<UserCheck className="h-4 w-4" />}
        />
        <KPICard
          title="Today's Check-Outs"
          value={todayCheckouts}
          icon={<Clock className="h-4 w-4" />}
        />
        <KPICard
          title="Pending Walk-Ins"
          value={pendingWalkins}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitors Currently Inside</CardTitle>
        </CardHeader>
        <CardContent>
          {currentVisitorsList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No visitors currently inside</p>
          ) : (
            <div className="space-y-3">
              {currentVisitorsList.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {log.visitor.firstName} {log.visitor.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      In: {formatTime(log.checkInTime)}
                    </p>
                    <Badge className={getStatusColor(log.status)}>
                      {log.isWalkIn ? "Walk-In" : "Appointment"}
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
