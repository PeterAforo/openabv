"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Empty, List, Spin, Tag, Typography } from "antd";
import { LogoutOutlined, TeamOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface VisitorLog {
  id: string;
  purpose: string;
  recipientName?: string;
  checkInTime: string;
  isWalkIn: boolean;
  badgeNumber?: string;
  visitor: { firstName: string; lastName: string; phone: string; company?: string };
}

export default function ReceptionistCurrentPage() {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchVisitors(); }, []);

  async function fetchVisitors() {
    try {
      const res = await fetch("/api/visitors/current");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVisitors(data.visitors || data || []);
    } catch {
      toast.error("Failed to load visitors");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckOut(logId: string) {
    try {
      const res = await fetch("/api/visitors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorLogId: logId }),
      });
      if (!res.ok) { toast.error("Check-out failed"); return; }
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch {
      toast.error("Check-out failed");
    }
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Current Visitors</Title>
          <Text type="secondary">Visitors currently on premises</Text>
        </div>
        <Tag icon={<TeamOutlined />} color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>{visitors.length} Inside</Tag>
      </div>

      {visitors.length === 0 ? (
        <Card><Empty image={<TeamOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />} description="No visitors currently inside" /></Card>
      ) : (
        <List
          dataSource={visitors}
          renderItem={(log) => (
            <List.Item
              key={log.id}
              style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }}
              actions={[<Button key="out" icon={<LogoutOutlined />} onClick={() => handleCheckOut(log.id)} size="small">Check Out</Button>]}
            >
              <List.Item.Meta
                title={<>
                  <Text strong>{log.visitor.firstName} {log.visitor.lastName}</Text>{" "}
                  <Tag color={log.isWalkIn ? "orange" : "blue"}>{log.isWalkIn ? "Walk-In" : "Appointment"}</Tag>
                  {log.badgeNumber && <Tag>Badge: {log.badgeNumber}</Tag>}
                </>}
                description={<>
                  <Text type="secondary">Purpose: {log.purpose}</Text>
                  {log.recipientName && <Text type="secondary"> · Visiting: {log.recipientName}</Text>}
                  <br /><Text type="secondary" style={{ fontSize: 11 }}>In since: {new Date(log.checkInTime).toLocaleTimeString()}</Text>
                </>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
