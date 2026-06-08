"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Empty, List, Spin, Tag, Typography } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      toast.error("Failed to update");
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to update");
    }
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Notifications</Title>
          <Text type="secondary">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</Text>
        </div>
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={markAllRead}>Mark All Read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card><Empty description="No notifications" /></Card>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(n) => (
            <List.Item
              key={n.id}
              style={{ opacity: n.isRead ? 0.6 : 1, background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }}
              actions={[
                <Tag key="type">{n.type}</Tag>,
                ...(!n.isRead ? [<Button key="read" type="text" size="small" icon={<CheckOutlined />} onClick={() => markAsRead(n.id)} />] : []),
              ]}
            >
              <List.Item.Meta
                avatar={<BellOutlined style={{ fontSize: 18, marginTop: 4 }} />}
                title={n.title}
                description={<><Text type="secondary">{n.message}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{new Date(n.createdAt).toLocaleString()}</Text></>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
