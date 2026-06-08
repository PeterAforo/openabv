"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { CalendarOutlined, ClockCircleOutlined, TeamOutlined, UserSwitchOutlined } from "@ant-design/icons";

interface Props {
  currentVisitors: number;
  todayAppointments: number;
  todayCheckins: number;
  pendingWalkins: number;
}

export function ReceptionistDashboardView({ currentVisitors, todayAppointments, todayCheckins, pendingWalkins }: Props) {
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
