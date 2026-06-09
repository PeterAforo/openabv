"use client";

import Link from "next/link";
import {
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  QrcodeOutlined,
  UserAddOutlined,
  AlertOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { KPICard } from "@/components/dashboard/kpi-card";

interface Props {
  stats: { currentVisitors: number; todayCheckins: number; todayCheckouts: number; pendingWalkins: number };
  visitors: { id: string; name: string; purpose: string; checkInTime: string; isWalkIn: boolean }[];
}

export function SecurityDashboardView({ stats, visitors }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#0A2540", margin: 0, lineHeight: 1.3 }}>Security Command Center</h2>
          <p style={{ fontSize: 14, color: "#43474D", margin: 0, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C48C", display: "inline-block" }} />
            System Live: Monitoring active entry points
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#0A2540", cursor: "pointer" }}>
            <DownloadOutlined style={{ fontSize: 14 }} />
            Export Logs
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Link href="/dashboard/security/scan-qr" style={{ textDecoration: "none" }}>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", padding: 24, borderRadius: 10, display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, background: "rgba(96,249,189,0.2)", color: "#006C4B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              <QrcodeOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0A2540" }}>Scan QR Code</div>
              <div style={{ fontSize: 11, color: "#43474D" }}>Validate mobile visitor passes</div>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/security/walkin" style={{ textDecoration: "none" }}>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", padding: 24, borderRadius: 10, display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, background: "rgba(96,249,189,0.2)", color: "#006C4B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
              <UserAddOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0A2540" }}>Register Walk-in</div>
              <div style={{ fontSize: 11, color: "#43474D" }}>Onboard unscheduled visitors</div>
            </div>
          </div>
        </Link>
        <div style={{ background: "rgba(186,26,26,0.04)", border: "1px solid rgba(186,26,26,0.15)", padding: 24, borderRadius: 10, display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, background: "#BA1A1A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            <AlertOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#BA1A1A" }}>Emergency Roll Call</div>
            <div style={{ fontSize: 11, color: "#43474D" }}>Initiate facility evacuation log</div>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
        <KPICard title="Currently Inside" value={stats.currentVisitors} icon={<TeamOutlined />} iconBg="rgba(0,108,75,0.1)" iconColor="#006C4B" />
        <KPICard title="Today's Check-Ins" value={stats.todayCheckins} icon={<UserOutlined />} iconBg="rgba(0,108,75,0.1)" iconColor="#006C4B" />
        <KPICard title="Today's Check-Outs" value={stats.todayCheckouts} icon={<ClockCircleOutlined />} />
        <KPICard title="Pending Walk-Ins" value={stats.pendingWalkins} icon={<WarningOutlined />} iconBg="rgba(251,188,14,0.15)" iconColor="#B28400" />
      </div>

      {/* Visitors Currently Inside Table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: "#0A2540", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            Visitors Currently Inside
          </h3>
          {visitors.length > 0 && (
            <span style={{ padding: "4px 12px", borderRadius: 999, background: "rgba(96,249,189,0.2)", color: "#006C4B", fontSize: 12, fontWeight: 600 }}>
              {visitors.length} Active
            </span>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 500 }}>
            <thead>
              <tr style={{ background: "#F1F5F9", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Visitor</th>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Purpose</th>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Check-In Time</th>
                <th style={{ padding: "12px 24px", fontSize: 12, fontWeight: 600, color: "#0A2540", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "40px 24px", textAlign: "center", color: "#74777E", fontSize: 14 }}>
                    No visitors currently inside
                  </td>
                </tr>
              ) : (
                visitors.map((v) => {
                  const initials = v.name.split(" ").map((n) => n[0]).join("").toUpperCase();
                  return (
                    <tr key={v.id} style={{ borderBottom: "1px solid #E5E7EB", transition: "background 0.15s" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(10,37,64,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#0A2540" }}>
                            {initials}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#0A2540" }}>{v.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#191C1E" }}>{v.purpose}</td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#191C1E" }}>
                        {new Date(v.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999,
                          background: v.isWalkIn ? "rgba(251,188,14,0.15)" : "rgba(0,108,75,0.1)",
                          color: v.isWalkIn ? "#B28400" : "#006C4B",
                          fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.02em",
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: v.isWalkIn ? "#FBBC0E" : "#00C48C" }} />
                          {v.isWalkIn ? "Walk-In" : "Appointment"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {visitors.length > 0 && (
          <div style={{ padding: "12px 24px", borderTop: "1px solid #E5E7EB", background: "#F2F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#43474D", fontWeight: 500 }}>Showing {visitors.length} active visitors</span>
            <Link href="/dashboard/security/current" style={{ fontSize: 12, fontWeight: 600, color: "#006C4B", textDecoration: "none" }}>View all →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
