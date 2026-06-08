"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, Dropdown, Drawer, Input, Typography } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  SafetyOutlined,
  BankOutlined,
  BranchesOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  BellOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  MenuOutlined,
  SearchOutlined,
  ScanOutlined,
  AlertOutlined,
  TeamOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { ChatWidget } from "./chat-widget";
import type { MenuProps } from "antd";

const { Text } = Typography;

interface DashboardShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  children: React.ReactNode;
}

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

function getNavItems(role: string): NavItem[] {
  const admin: NavItem[] = [
    { key: "/dashboard/admin", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/dashboard/admin/appointments", icon: <CalendarOutlined />, label: "Appointments" },
    { key: "/dashboard/admin/visitors", icon: <UserOutlined />, label: "Visitors" },
    { key: "/dashboard/admin/users", icon: <SafetyOutlined />, label: "Users" },
    { key: "/dashboard/admin/departments", icon: <BankOutlined />, label: "Departments" },
    { key: "/dashboard/admin/branches", icon: <BranchesOutlined />, label: "Branches" },
    { key: "/dashboard/admin/calendar", icon: <CalendarOutlined />, label: "Calendar" },
    { key: "/dashboard/admin/meeting-rooms", icon: <HomeOutlined />, label: "Meeting Rooms" },
    { key: "/dashboard/admin/watchlist", icon: <AlertOutlined />, label: "Watchlist" },
    { key: "/dashboard/admin/emergency-roll-call", icon: <TeamOutlined />, label: "Emergency Roll Call" },
    { key: "/dashboard/admin/reports", icon: <BarChartOutlined />, label: "Reports" },
    { key: "/dashboard/admin/reports/analytics", icon: <BarChartOutlined />, label: "Analytics" },
    { key: "/dashboard/admin/notifications", icon: <BellOutlined />, label: "Notifications" },
    { key: "/dashboard/chat", icon: <MessageOutlined />, label: "Live Chat" },
    { key: "/dashboard/queue", icon: <OrderedListOutlined />, label: "Visitor Queue" },
    { key: "/dashboard/admin/audit-logs", icon: <FileTextOutlined />, label: "Audit Logs" },
    { key: "/dashboard/admin/settings", icon: <SettingOutlined />, label: "Settings" },
  ];

  const security: NavItem[] = [
    { key: "/dashboard/security", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/dashboard/security/check", icon: <AuditOutlined />, label: "Check Appointment" },
    { key: "/dashboard/security/walkin", icon: <CheckCircleOutlined />, label: "Walk-In" },
    { key: "/dashboard/security/scan-qr", icon: <ScanOutlined />, label: "Scan QR" },
    { key: "/dashboard/security/active-visitors", icon: <TeamOutlined />, label: "Active Visitors" },
    { key: "/dashboard/queue", icon: <OrderedListOutlined />, label: "Visitor Queue" },
    { key: "/dashboard/security/current", icon: <UserOutlined />, label: "Current Visitors" },
    { key: "/dashboard/security/log", icon: <ClockCircleOutlined />, label: "Visitor Log" },
    { key: "/dashboard/chat", icon: <MessageOutlined />, label: "Live Chat" },
    { key: "/dashboard/security/notifications", icon: <BellOutlined />, label: "Notifications" },
  ];

  const staff: NavItem[] = [
    { key: "/dashboard/staff", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/dashboard/staff/appointments", icon: <CalendarOutlined />, label: "Appointments" },
    { key: "/dashboard/staff/walkins", icon: <CheckCircleOutlined />, label: "Walk-In Requests" },
    { key: "/dashboard/staff/calendar", icon: <CalendarOutlined />, label: "Calendar" },
    { key: "/dashboard/chat", icon: <MessageOutlined />, label: "Live Chat" },
    { key: "/dashboard/staff/history", icon: <ClockCircleOutlined />, label: "Visitor History" },
    { key: "/dashboard/staff/notifications", icon: <BellOutlined />, label: "Notifications" },
  ];

  const receptionist: NavItem[] = [
    { key: "/dashboard/receptionist", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/dashboard/receptionist/appointments", icon: <CalendarOutlined />, label: "Appointments" },
    { key: "/dashboard/receptionist/checkin", icon: <CheckCircleOutlined />, label: "Check-In" },
    { key: "/dashboard/receptionist/walkin", icon: <UserOutlined />, label: "Walk-In" },
    { key: "/dashboard/queue", icon: <OrderedListOutlined />, label: "Visitor Queue" },
    { key: "/dashboard/receptionist/current", icon: <ClockCircleOutlined />, label: "Current Visitors" },
    { key: "/dashboard/chat", icon: <MessageOutlined />, label: "Live Chat" },
    { key: "/dashboard/receptionist/notifications", icon: <BellOutlined />, label: "Notifications" },
  ];

  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return admin;
    case "SECURITY":
      return security;
    case "RECEPTIONIST":
      return receptionist;
    default:
      return staff;
  }
}

function getNotificationsPath(role: string): string {
  const r = role.toLowerCase();
  if (r === "super_admin" || r === "admin") return "/dashboard/admin/notifications";
  if (r === "security") return "/dashboard/security/notifications";
  if (r === "receptionist") return "/dashboard/receptionist/notifications";
  return "/dashboard/staff/notifications";
}

function getCtaConfig(role: string): { label: string; href: string } {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return { label: "Pre-register Visitor", href: "/dashboard/admin/visitors" };
    case "SECURITY":
      return { label: "Check In Visitor", href: "/dashboard/security/walkin" };
    case "RECEPTIONIST":
      return { label: "Check In Visitor", href: "/dashboard/receptionist/checkin" };
    default:
      return { label: "Schedule New Visit", href: "/dashboard/staff/appointments" };
  }
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = getNavItems(user.role);
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase();
  const cta = getCtaConfig(user.role);

  useEffect(() => {
    let stopped = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    async function fetchCount() {
      if (stopped) return;
      try {
        const res = await fetch("/api/notifications?unread=true&limit=1");
        if (res.status === 401) { stopped = true; if (intervalId) clearInterval(intervalId); return; }
        if (res.ok) { const data = await res.json(); setUnreadCount(data.unreadCount || 0); }
      } catch { /* ignore */ }
    }
    const timeout = setTimeout(fetchCount, 1500);
    intervalId = setInterval(fetchCount, 30000);
    return () => { stopped = true; clearTimeout(timeout); if (intervalId) clearInterval(intervalId); };
  }, []);

  const selectedKey = navItems.find((item) => pathname === item.key || pathname.startsWith(item.key + "/"))?.key || "";

  const userMenuItems: MenuProps["items"] = [
    { key: "info", label: <div><Text strong>{user.name}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{user.role.replace("_", " ")}</Text></div>, disabled: true },
    { type: "divider" },
    { key: "profile", label: "Profile", icon: <UserOutlined /> },
    { type: "divider" },
    { key: "signout", label: "Sign Out", icon: <LogoutOutlined />, danger: true },
  ];

  const handleUserMenu: MenuProps["onClick"] = (e) => {
    if (e.key === "profile") router.push("/dashboard/profile");
    if (e.key === "signout") router.push("/api/auth/signout");
  };

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0A2540" }}>
      {/* Logo */}
      <div style={{ padding: "24px 24px 32px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#00C48C", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>⬡</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#fff", lineHeight: 1.2 }}>VisitFlow</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500, letterSpacing: "0.01em" }}>Enterprise Suite</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflow: "auto", paddingBottom: 16 }}>
        {navItems.map((item) => {
          const isActive = selectedKey === item.key;
          return (
            <Link
              key={item.key}
              href={item.key}
              onClick={() => setDrawerOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px 10px 20px",
                margin: "2px 0",
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                textDecoration: "none",
                borderLeft: isActive ? "4px solid #00C48C" : "4px solid transparent",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 18, display: "flex", opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: "0 16px 24px" }}>
        {/* CTA Button */}
        <Link href={cta.href} onClick={() => setDrawerOpen(false)} style={{ textDecoration: "none" }}>
          <button style={{ width: "100%", padding: "12px 16px", background: "#00C48C", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,196,140,0.3)", transition: "opacity 0.15s" }}>
            <UserAddOutlined style={{ fontSize: 16 }} />
            {cta.label}
          </button>
        </Link>

        {/* Support & Logout */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px", color: "rgba(255,255,255,0.6)", fontSize: 14, textDecoration: "none" }}>
            <QuestionCircleOutlined style={{ fontSize: 16 }} />
            <span>Support</span>
          </a>
          <Link href="/api/auth/signout" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px", color: "rgba(255,255,255,0.6)", fontSize: 14, textDecoration: "none" }}>
            <LogoutOutlined style={{ fontSize: 16 }} />
            <span>Logout</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Desktop Sidebar */}
      <aside className="vf-sidebar" style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, zIndex: 100, overflowY: "auto" }}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0 }, wrapper: {} }}
        rootClassName="vf-mobile-drawer"
      >
        {sidebarContent}
      </Drawer>

      {/* Main Area */}
      <div className="vf-main" style={{ flex: 1, marginLeft: 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "#fff", borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {/* Left: Mobile menu + Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button className="vf-mobile-menu-btn" onClick={() => setDrawerOpen(true)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#43474D", padding: 4 }}>
              <MenuOutlined />
            </button>
            <Input
              prefix={<SearchOutlined style={{ color: "#74777E" }} />}
              placeholder="Search visitors, hosts, or tags..."
              style={{ width: 320, borderRadius: 8, background: "#F2F4F6", border: "1px solid #E5E7EB" }}
              variant="filled"
              className="vf-search-input"
            />
          </div>

          {/* Right: Bell + User */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href={getNotificationsPath(user.role)} style={{ position: "relative", padding: 8, borderRadius: "50%", color: "#43474D", transition: "background 0.15s" }}>
              <BellOutlined style={{ fontSize: 20 }} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "#BA1A1A", borderRadius: "50%" }} />
              )}
            </Link>
            <QuestionCircleOutlined style={{ fontSize: 20, color: "#43474D", cursor: "pointer" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 16, borderLeft: "1px solid #E5E7EB" }}>
              <div style={{ textAlign: "right" }} className="vf-user-info">
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", lineHeight: 1.3 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "#43474D", fontWeight: 500 }}>{user.role.replace("_", " ")}</div>
              </div>
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={["click"]} placement="bottomRight">
                <Avatar size={40} src={user.image || undefined} style={{ cursor: "pointer", backgroundColor: "#0A2540", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  {initials}
                </Avatar>
              </Dropdown>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 32, background: "#F8FAFC", minHeight: "calc(100vh - 64px)" }}>
          <div style={{ maxWidth: 1440, margin: "0 auto", width: "100%" }}>
            {children}
          </div>
        </main>
      </div>

      <ChatWidget userId={user.id} />

      <style jsx global>{`
        @media (max-width: 991px) {
          .vf-sidebar { display: none !important; }
          .vf-main { margin-left: 0 !important; }
          .vf-mobile-menu-btn { display: flex !important; }
          .vf-search-input { width: 200px !important; }
          .vf-user-info { display: none !important; }
        }
        @media (min-width: 992px) {
          .vf-mobile-drawer .ant-drawer-mask,
          .vf-mobile-drawer .ant-drawer-content-wrapper { display: none !important; }
        }
        .vf-sidebar::-webkit-scrollbar { width: 6px; }
        .vf-sidebar::-webkit-scrollbar-track { background: transparent; }
        .vf-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
