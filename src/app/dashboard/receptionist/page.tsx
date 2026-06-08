import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { KPICard } from "@/components/dashboard/kpi-card";
import { CalendarOutlined, ClockCircleOutlined, TeamOutlined, UserSwitchOutlined } from "@ant-design/icons";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Receptionist Dashboard</h1>
        <p className="text-muted-foreground">Manage appointments and visitor check-ins</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Currently Inside" value={currentVisitors} icon={<TeamOutlined />} />
        <KPICard title="Today's Appointments" value={todayAppointments} icon={<CalendarOutlined />} />
        <KPICard title="Today's Check-Ins" value={todayCheckins} icon={<UserSwitchOutlined />} />
        <KPICard title="Pending Walk-Ins" value={pendingWalkins} icon={<ClockCircleOutlined />} />
      </div>
    </div>
  );
}
