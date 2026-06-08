"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Layout, Menu, Avatar, Badge, Dropdown, Drawer, Input, Typography, theme } from "antd";
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
} from "@ant-design/icons";
import { ChatWidget } from "./chat-widget";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = Layout;
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

function getMenuItems(role: string): MenuProps["items"] {
  const admin = [
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

  const security = [
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

  const staff = [
    { key: "/dashboard/staff", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/dashboard/staff/appointments", icon: <CalendarOutlined />, label: "Appointments" },
    { key: "/dashboard/staff/walkins", icon: <CheckCircleOutlined />, label: "Walk-In Requests" },
    { key: "/dashboard/staff/calendar", icon: <CalendarOutlined />, label: "Calendar" },
    { key: "/dashboard/chat", icon: <MessageOutlined />, label: "Live Chat" },
    { key: "/dashboard/staff/history", icon: <ClockCircleOutlined />, label: "Visitor History" },
    { key: "/dashboard/staff/notifications", icon: <BellOutlined />, label: "Notifications" },
  ];

  const receptionist = [
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

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  const menuItems = getMenuItems(user.role);
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase();

  // Fetch unread notifications
  React.useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications?unread=true&limit=1");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch { /* ignore */ }
    }
    const timeout = setTimeout(fetchCount, 1500);
    const interval = setInterval(fetchCount, 30000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []);

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    router.push(e.key);
    setDrawerOpen(false);
  };

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

  // Find selected key
  const selectedKey = menuItems?.find((item) => item && "key" in item && typeof item.key === "string" && (pathname === item.key || pathname.startsWith(item.key + "/")))?.key as string || "";

  const siderContent = (
    <>
      <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? 0 : "0 24px", borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", color: "#00C48C", fontWeight: 700, fontSize: 13 }}>VF</div>
          {!collapsed && <span style={{ fontWeight: 600, fontSize: 18, color: token.colorText }}>VisitFlow</span>}
        </Link>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ border: "none", flex: 1, overflow: "auto" }}
      />
      <Menu
        mode="inline"
        selectable={false}
        items={[{ key: "signout", icon: <LogoutOutlined />, label: "Sign Out", danger: true }]}
        onClick={() => router.push("/api/auth/signout")}
        style={{ border: "none" }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Sider */}
      <Sider
        width={256}
        collapsedWidth={80}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsible
        breakpoint="lg"
        trigger={null}
        style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100, display: "flex", flexDirection: "column", background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}
        className="hidden-mobile"
      >
        {siderContent}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={256}
        styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
        className="lg-hidden"
      >
        {siderContent}
      </Drawer>

      <Layout style={{ marginLeft: collapsed ? 80 : 256, transition: "margin-left 0.2s" }}>
        {/* Header */}
        <Header style={{ padding: "0 24px", background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}`, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 50, height: 64 }}>
          <MenuOutlined
            onClick={() => setDrawerOpen(true)}
            style={{ fontSize: 18, cursor: "pointer", display: "none" }}
            className="mobile-menu-btn"
          />

          <div style={{ flex: 1 }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search..."
              style={{ maxWidth: 320 }}
              variant="filled"
            />
          </div>

          <Badge count={unreadCount} size="small">
            <Link href={getNotificationsPath(user.role)}>
              <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
            </Link>
          </Badge>

          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} trigger={["click"]} placement="bottomRight">
            <Avatar src={user.image || undefined} style={{ cursor: "pointer", backgroundColor: token.colorPrimary }}>
              {initials}
            </Avatar>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
          {children}
        </Content>
      </Layout>

      <ChatWidget userId={user.id} />

      <style jsx global>{`
        @media (max-width: 991px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: inline-block !important; }
          .ant-layout { margin-left: 0 !important; }
        }
        @media (min-width: 992px) {
          .lg-hidden .ant-drawer-mask,
          .lg-hidden .ant-drawer-content-wrapper { display: none !important; }
        }
      `}</style>
    </Layout>
  );
}
