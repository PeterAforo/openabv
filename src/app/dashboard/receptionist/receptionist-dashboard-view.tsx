"use client";

import Link from "next/link";
import { KPICard } from "@/components/dashboard/kpi-card";
import { CalendarOutlined, ClockCircleOutlined, TeamOutlined, UserSwitchOutlined, CheckCircleOutlined } from "@ant-design/icons";

interface Props {
  currentVisitors: number;
  todayAppointments: number;
  todayCheckins: number;
  pendingWalkins: number;
}

export function ReceptionistDashboardView({ currentVisitors, todayAppointments, todayCheckins, pendingWalkins }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#0A2540", margin: 0, lineHeight: 1.3 }}>Receptionist Dashboard</h2>
          <p style={{ fontSize: 14, color: "#43474D", margin: 0, marginTop: 4 }}>Manage appointments and visitor check-ins</p>
        </div>
        <Link href="/dashboard/receptionist/checkin" style={{ textDecoration: "none" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#00C48C", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,196,140,0.3)" }}>
            <CheckCircleOutlined style={{ fontSize: 14 }} />
            Check In Visitor
          </button>
        </Link>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
        <KPICard title="Currently Inside" value={currentVisitors} icon={<TeamOutlined />} iconBg="rgba(0,108,75,0.1)" iconColor="#006C4B" />
        <KPICard title="Today's Appointments" value={todayAppointments} icon={<CalendarOutlined />} />
        <KPICard title="Today's Check-Ins" value={todayCheckins} icon={<UserSwitchOutlined />} iconBg="rgba(0,108,75,0.1)" iconColor="#006C4B" />
        <KPICard title="Pending Walk-Ins" value={pendingWalkins} icon={<ClockCircleOutlined />} iconBg="rgba(251,188,14,0.15)" iconColor="#B28400" />
      </div>
    </div>
  );
}
