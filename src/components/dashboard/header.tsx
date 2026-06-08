"use client";

import React, { useEffect, useState } from "react";
import { Avatar, Badge, Button, Dropdown, Input, Tag, Typography } from "antd";
import { BellOutlined, LogoutOutlined, MenuOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import Link from "next/link";

const { Text } = Typography;

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  onMenuToggle?: () => void;
}

function getNotificationsPath(role: string): string {
  const r = role.toLowerCase();
  if (r === "super_admin" || r === "admin") return "/dashboard/admin/notifications";
  if (r === "security") return "/dashboard/security/notifications";
  if (r === "receptionist") return "/dashboard/receptionist/notifications";
  return "/dashboard/staff/notifications";
}

export function DashboardHeader({ user, onMenuToggle }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    let stopped = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function fetchCount() {
      if (stopped) return;
      try {
        const res = await fetch("/api/notifications?unread=true&limit=1");
        if (res.status === 401) {
          stopped = true;
          if (intervalId) clearInterval(intervalId);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // silently fail
      }
    }
    const timeout = setTimeout(fetchCount, 1500);
    intervalId = setInterval(fetchCount, 30000);
    return () => { stopped = true; clearTimeout(timeout); if (intervalId) clearInterval(intervalId); };
  }, []);

  const dropdownItems: MenuProps["items"] = [
    {
      key: "info",
      label: (
        <div style={{ padding: "4px 0" }}>
          <Text strong style={{ display: "block" }}>{user.name}</Text>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{user.email}</Text>
          <Tag style={{ marginTop: 4, fontSize: 10 }}>{user.role.replace("_", " ")}</Tag>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    { key: "profile", label: <Link href="/dashboard/profile">Profile</Link>, icon: <UserOutlined /> },
    { type: "divider" },
    { key: "signout", label: <Link href="/api/auth/signout">Sign out</Link>, icon: <LogoutOutlined />, danger: true },
  ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", height: 64, alignItems: "center", gap: 16, borderBottom: "1px solid #f0f0f0", background: "#fff", padding: "0 16px" }}>
      <Button type="text" icon={<MenuOutlined />} onClick={onMenuToggle} className="lg:!hidden" />

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
        <div className="hidden md:block" style={{ maxWidth: 300, width: "100%" }}>
          <Input prefix={<SearchOutlined />} placeholder="Search..." />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={getNotificationsPath(user.role)}>
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <Button type="text" icon={<BellOutlined style={{ fontSize: 20 }} />} />
          </Badge>
        </Link>

        <Dropdown menu={{ items: dropdownItems }} trigger={["click"]} placement="bottomRight">
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0, borderRadius: "50%" }}>
            <Avatar size={36} src={user.image || undefined} icon={<UserOutlined />} style={{ background: "#0A2540" }}>{initials}</Avatar>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
