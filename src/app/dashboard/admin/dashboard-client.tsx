"use client";

import Link from "next/link";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserSwitchOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  stats: {
    totalAppointments: number;
    todayAppointments: number;
    pendingAppointments: number;
    currentVisitors: number;
    totalVisitors: number;
    walkInRequests: number;
  };
  recentAppointments: {
    id: string;
    visitorName: string;
    recipientName: string;
    date: string;
    startTime: string;
    status: string;
  }[];
}

const statusConfig: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  PENDING: { bg: "rgba(251,188,14,0.15)", color: "#B28400", dot: "#FBBC0E", label: "Pending" },
  APPROVED: { bg: "rgba(0,108,75,0.1)", color: "#006C4B", dot: "#00C48C", label: "Approved" },
  DECLINED: { bg: "rgba(186,26,26,0.1)", color: "#BA1A1A", dot: "#BA1A1A", label: "Declined" },
  RESCHEDULED: { bg: "rgba(73,96,126,0.1)", color: "#49607E", dot: "#49607E", label: "Rescheduled" },
  CANCELLED: { bg: "rgba(116,119,126,0.1)", color: "#74777E", dot: "#74777E", label: "Cancelled" },
  CHECKED_IN: { bg: "rgba(0,108,75,0.1)", color: "#006C4B", dot: "#00C48C", label: "Checked In" },
  CHECKED_OUT: { bg: "rgba(49,72,101,0.1)", color: "#314865", dot: "#314865", label: "Checked Out" },
  NO_SHOW: { bg: "rgba(186,26,26,0.1)", color: "#BA1A1A", dot: "#BA1A1A", label: "No Show" },
  COMPLETED: { bg: "rgba(0,108,75,0.1)", color: "#006C4B", dot: "#006C4B", label: "Completed" },
  ARRIVED: { bg: "rgba(0,108,75,0.1)", color: "#006C4B", dot: "#00C48C", label: "Arrived" },
};

export function AdminDashboardClient({ stats, recentAppointments }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#0A2540", margin: 0, lineHeight: 1.3 }}>Dashboard Overview</h2>
            <p style={{ fontSize: 14, color: "#43474D", margin: 0, marginTop: 4 }}>Welcome back. Here&apos;s what&apos;s happening today.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#0A2540", cursor: "pointer" }}>
              <DownloadOutlined style={{ fontSize: 14 }} />
              Export Report
            </button>
            <Link href="/dashboard/admin/visitors" style={{ textDecoration: "none" }}>
              <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#0A2540", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                <PlusOutlined style={{ fontSize: 14 }} />
                Pre-register Visitor
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
        <KPICard title="Total Appointments" value={stats.totalAppointments} icon={<CalendarOutlined />} />
        <KPICard title="Today's Appointments" value={stats.todayAppointments} icon={<ClockCircleOutlined />} iconBg="rgba(0,108,75,0.1)" iconColor="#006C4B" />
        <KPICard title="Pending Approval" value={stats.pendingAppointments} icon={<ExclamationCircleOutlined />} iconBg="rgba(251,188,14,0.15)" iconColor="#B28400" />
        <KPICard title="Currently Inside" value={stats.currentVisitors} icon={<UserSwitchOutlined />} iconBg="rgba(0,108,75,0.1)" iconColor="#006C4B" />
        <KPICard title="Today's Visitors" value={stats.totalVisitors} icon={<TeamOutlined />} />
        <KPICard title="Walk-In Requests" value={stats.walkInRequests} icon={<CheckCircleOutlined />} iconBg="rgba(186,26,26,0.08)" iconColor="#BA1A1A" />
      </div>

      {/* Recent Appointments Table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0A2540", margin: 0 }}>Recent Appointments</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 500 }}>
            <thead>
              <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Visitor</th>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Host</th>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date & Time</th>
                <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "40px 24px", textAlign: "center", color: "#74777E", fontSize: 14 }}>
                    No appointments yet
                  </td>
                </tr>
              ) : (
                recentAppointments.map((apt) => {
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
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#191C1E" }}>{apt.recipientName}</td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#191C1E" }}>{formatDate(apt.date)} {formatTime(apt.startTime)}</td>
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
        {recentAppointments.length > 0 && (
          <div style={{ padding: "12px 24px", borderTop: "1px solid #E5E7EB", background: "#F2F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#43474D", fontWeight: 500 }}>Showing {recentAppointments.length} recent appointments</span>
            <Link href="/dashboard/admin/appointments" style={{ fontSize: 12, fontWeight: 600, color: "#006C4B", textDecoration: "none" }}>View all →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
