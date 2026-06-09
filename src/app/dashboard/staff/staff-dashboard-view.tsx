"use client";

import Link from "next/link";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MessageOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { KPICard } from "@/components/dashboard/kpi-card";

const statusConfig: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  PENDING: { bg: "rgba(251,188,14,0.15)", color: "#B28400", dot: "#FBBC0E", label: "Pending" },
  APPROVED: { bg: "rgba(0,108,75,0.1)", color: "#006C4B", dot: "#00C48C", label: "Approved" },
  DECLINED: { bg: "rgba(186,26,26,0.1)", color: "#BA1A1A", dot: "#BA1A1A", label: "Declined" },
};

interface Props {
  stats: { totalAppointments: number; pendingAppointments: number; pendingWalkins: number; todayAppointments: number };
  appointments: { id: string; visitorName: string; purpose: string; date: string; startTime: string; status: string }[];
}

export function StaffDashboardView({ stats, appointments }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#0A2540", margin: 0, lineHeight: 1.3 }}>My Dashboard</h2>
          <p style={{ fontSize: 14, color: "#43474D", margin: 0, marginTop: 4 }}>Your appointments and visitor requests</p>
        </div>
        <Link href="/dashboard/staff/appointments" style={{ textDecoration: "none" }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#0A2540", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
            <PlusOutlined style={{ fontSize: 14 }} />
            Schedule New Visit
          </button>
        </Link>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
        <KPICard title="Total Appointments" value={stats.totalAppointments} icon={<CalendarOutlined />} />
        <KPICard title="Pending Approval" value={stats.pendingAppointments} icon={<ClockCircleOutlined />} iconBg="rgba(251,188,14,0.15)" iconColor="#B28400" />
        <KPICard title="Walk-In Requests" value={stats.pendingWalkins} icon={<UserOutlined />} iconBg="rgba(186,26,26,0.08)" iconColor="#BA1A1A" />
        <KPICard title="Today's Meetings" value={stats.todayAppointments} icon={<MessageOutlined />} iconBg="rgba(0,108,75,0.1)" iconColor="#006C4B" />
      </div>

      {/* Upcoming Appointments Table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0A2540", margin: 0 }}>Upcoming Appointments</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 500 }}>
            <thead>
              <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Visitor</th>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Purpose</th>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date & Time</th>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "40px 24px", textAlign: "center", color: "#74777E", fontSize: 14 }}>
                    No upcoming appointments
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const sc = statusConfig[apt.status] || { bg: "rgba(116,119,126,0.1)", color: "#74777E", dot: "#74777E", label: apt.status };
                  const initials = apt.visitorName.split(" ").map((n) => n[0]).join("").toUpperCase();
                  return (
                    <tr key={apt.id} style={{ borderBottom: "1px solid #E5E7EB", transition: "background 0.15s" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(10,37,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#0A2540" }}>
                            {initials}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#0A2540" }}>{apt.visitorName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#191C1E" }}>{apt.purpose}</td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#191C1E" }}>
                        {new Date(apt.date).toLocaleDateString()} {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {appointments.length > 0 && (
          <div style={{ padding: "12px 24px", borderTop: "1px solid #E5E7EB", background: "#F2F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#43474D", fontWeight: 500 }}>Showing {appointments.length} upcoming appointments</span>
            <Link href="/dashboard/staff/appointments" style={{ fontSize: 12, fontWeight: 600, color: "#006C4B", textDecoration: "none" }}>View all →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
