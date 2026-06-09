"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Drawer, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  AppstoreOutlined,
  CalendarOutlined,
  TeamOutlined,
  SafetyOutlined,
  BankOutlined,
  BranchesOutlined,
  SolutionOutlined,
  UserSwitchOutlined,
  BellOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  LockOutlined,
  ToolOutlined,
  CrownOutlined,
  RobotOutlined,
  QrcodeOutlined,
  UserOutlined,
} from "@ant-design/icons";

type NavItem = { title: string; href: string; icon: React.ReactNode };

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/admin", icon: <AppstoreOutlined /> },
  { title: "Appointments", href: "/dashboard/admin/appointments", icon: <CalendarOutlined /> },
  { title: "Visitors", href: "/dashboard/admin/visitors", icon: <TeamOutlined /> },
  { title: "Users", href: "/dashboard/admin/users", icon: <SafetyOutlined /> },
  { title: "Departments", href: "/dashboard/admin/departments", icon: <BankOutlined /> },
  { title: "Branches", href: "/dashboard/admin/branches", icon: <BranchesOutlined /> },
  { title: "Calendar", href: "/dashboard/admin/calendar", icon: <CalendarOutlined /> },
  { title: "Reports", href: "/dashboard/admin/reports", icon: <BarChartOutlined /> },
  { title: "Notifications", href: "/dashboard/admin/notifications", icon: <BellOutlined /> },
  { title: "Live Chat", href: "/dashboard/chat", icon: <MessageOutlined /> },
  { title: "Visitor Queue", href: "/dashboard/queue", icon: <OrderedListOutlined /> },
  { title: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: <FileTextOutlined /> },
  { title: "Approval Rules", href: "/dashboard/admin/approval-rules", icon: <ThunderboltOutlined /> },
  { title: "Documents", href: "/dashboard/admin/documents", icon: <FileTextOutlined /> },
  { title: "Access Control", href: "/dashboard/admin/access-control", icon: <ApiOutlined /> },
  { title: "Contractors", href: "/dashboard/admin/contractors", icon: <ToolOutlined /> },
  { title: "Privacy", href: "/dashboard/admin/privacy", icon: <LockOutlined /> },
  { title: "Subscriptions", href: "/dashboard/admin/subscriptions", icon: <CrownOutlined /> },
  { title: "AI Assistant", href: "/dashboard/ai-assistant", icon: <RobotOutlined /> },
  { title: "Settings", href: "/dashboard/admin/settings", icon: <SettingOutlined /> },
];

const securityNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/security", icon: <AppstoreOutlined /> },
  { title: "Check Appointment", href: "/dashboard/security/check", icon: <SolutionOutlined /> },
  { title: "Walk-In", href: "/dashboard/security/walkin", icon: <UserSwitchOutlined /> },
  { title: "Visitor Queue", href: "/dashboard/queue", icon: <OrderedListOutlined /> },
  { title: "Current Visitors", href: "/dashboard/security/current", icon: <TeamOutlined /> },
  { title: "Visitor Log", href: "/dashboard/security/log", icon: <ClockCircleOutlined /> },
  { title: "Live Chat", href: "/dashboard/chat", icon: <MessageOutlined /> },
  { title: "Notifications", href: "/dashboard/security/notifications", icon: <BellOutlined /> },
];

const staffNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/staff", icon: <AppstoreOutlined /> },
  { title: "Appointments", href: "/dashboard/staff/appointments", icon: <CalendarOutlined /> },
  { title: "Pre-Register", href: "/dashboard/staff/pre-register", icon: <UserOutlined /> },
  { title: "Walk-In Requests", href: "/dashboard/staff/walkins", icon: <UserSwitchOutlined /> },
  { title: "Calendar", href: "/dashboard/staff/calendar", icon: <CalendarOutlined /> },
  { title: "My QR Code", href: "/dashboard/staff/qrcode", icon: <QrcodeOutlined /> },
  { title: "Live Chat", href: "/dashboard/chat", icon: <MessageOutlined /> },
  { title: "Messages", href: "/dashboard/staff/messages", icon: <MessageOutlined /> },
  { title: "Visitor History", href: "/dashboard/staff/history", icon: <ClockCircleOutlined /> },
  { title: "Notifications", href: "/dashboard/staff/notifications", icon: <BellOutlined /> },
];

const receptionistNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard/receptionist", icon: <AppstoreOutlined /> },
  { title: "Appointments", href: "/dashboard/receptionist/appointments", icon: <CalendarOutlined /> },
  { title: "Check-In", href: "/dashboard/receptionist/checkin", icon: <UserSwitchOutlined /> },
  { title: "Walk-In", href: "/dashboard/receptionist/walkin", icon: <TeamOutlined /> },
  { title: "Visitor Queue", href: "/dashboard/queue", icon: <OrderedListOutlined /> },
  { title: "Current Visitors", href: "/dashboard/receptionist/current", icon: <ClockCircleOutlined /> },
  { title: "Live Chat", href: "/dashboard/chat", icon: <MessageOutlined /> },
  { title: "Notifications", href: "/dashboard/receptionist/notifications", icon: <BellOutlined /> },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN": case "ADMIN": return adminNav;
    case "SECURITY": return securityNav;
    case "RECEPTIONIST": return receptionistNav;
    default: return staffNav;
  }
}

interface MobileSidebarProps { role: string; isOpen: boolean; onClose: () => void; }

export function MobileSidebar({ role, isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  const menuItems: MenuProps["items"] = navItems.map((item) => ({
    key: item.href,
    icon: item.icon,
    label: <Link href={item.href} onClick={onClose}>{item.title}</Link>,
  }));

  menuItems.push({ type: "divider" } as never);
  menuItems.push({
    key: "signout",
    icon: <LogoutOutlined />,
    label: <Link href="/api/auth/signout">Sign Out</Link>,
    danger: true,
  });

  const selectedKey = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.href || "";

  return (
    <Drawer open={isOpen} onClose={onClose} placement="left" width={256} styles={{ body: { padding: 0 } }}
      title={
        <Link href="/dashboard" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ height: 32, width: 32, borderRadius: 8, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#00C48C", fontWeight: "bold", fontSize: 14 }}>VF</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 18 }}>VisitFlow</span>
        </Link>
      }
    >
      <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ borderRight: 0 }} />
    </Drawer>
  );
}
