"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Col, Empty, Row, Space, Spin, Statistic, Tag, Typography } from "antd";
import { ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import { usePusherEvent } from "@/hooks/use-pusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";

const { Title, Text } = Typography;

interface QueueItem {
  id: string;
  position: number;
  visitor: { id: string; firstName: string; lastName: string; phone: string; company?: string };
  recipient: { id: string; firstName: string; lastName: string; department?: { name: string } };
  purpose: string;
  decision: string;
  decisionNote: string | null;
  createdAt: string;
  waitTimeMinutes: number;
  respondedAt: string | null;
}

const decisionTagColor: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  WAIT: "processing",
  DECLINED: "error",
  RESCHEDULED: "purple",
};

const borderColors: Record<string, string> = {
  PENDING: "#faad14",
  APPROVED: "#52c41a",
  WAIT: "#1677ff",
  DECLINED: "#ff4d4f",
};

function formatWaitTime(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ACTIVE" | "ALL_TODAY">("ACTIVE");

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/walkins/queue?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch {
      toast.error("Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  usePusherEvent(CHANNELS.security, EVENTS.WALKIN_DECISION, () => { fetchQueue(); });

  async function handleDecision(id: string, decision: string) {
    try {
      const res = await fetch(`/api/walkins/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: "" }),
      });
      if (res.ok) {
        toast.success(`Visitor ${decision.toLowerCase()}`);
        fetchQueue();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  const pendingCount = queue.filter((q) => q.decision === "PENDING").length;
  const waitingCount = queue.filter((q) => q.decision === "WAIT").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Visitor Queue</Title>
          <Text type="secondary">Real-time visitor waiting queue management</Text>
        </div>
        <Space>
          <Button type={filter === "ACTIVE" ? "primary" : "default"} size="small" onClick={() => setFilter("ACTIVE")}>Active Queue</Button>
          <Button type={filter === "ALL_TODAY" ? "primary" : "default"} size="small" onClick={() => setFilter("ALL_TODAY")}>All Today</Button>
          <Button type="text" icon={<ReloadOutlined />} onClick={fetchQueue} />
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Awaiting Response" value={pendingCount} valueStyle={{ color: "#faad14" }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Asked to Wait" value={waitingCount} valueStyle={{ color: "#1677ff" }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Approved Today" value={queue.filter((q) => q.decision === "APPROVED").length} valueStyle={{ color: "#52c41a" }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Total Walk-Ins" value={queue.length} /></Card>
        </Col>
      </Row>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>
      ) : queue.length === 0 ? (
        <Card><Empty image={<TeamOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />} description="No visitors in queue" /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {queue.map((item) => (
            <Card
              key={item.id}
              size="small"
              style={{ borderLeft: `4px solid ${borderColors[item.decision] || "#d9d9d9"}` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong>#{item.position} {item.visitor.firstName} {item.visitor.lastName}</Text>
                    {item.visitor.company && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>({item.visitor.company})</Text>}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    To see: <Text strong style={{ fontSize: 12 }}>{item.recipient.firstName} {item.recipient.lastName}</Text>
                    {item.recipient.department && ` · ${item.recipient.department.name}`}
                  </Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>Purpose: {item.purpose}</Text></div>
                  {item.decisionNote && <div><Text type="secondary" italic style={{ fontSize: 12 }}>Note: {item.decisionNote}</Text></div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <Space size={4}>
                    {(item.decision === "PENDING" || item.decision === "WAIT") && (
                      <Tag icon={<ClockCircleOutlined />} color="orange">{formatWaitTime(item.waitTimeMinutes)}</Tag>
                    )}
                    <Tag color={decisionTagColor[item.decision] || "default"}>{item.decision}</Tag>
                  </Space>

                  {item.decision === "PENDING" && (
                    <Space size={4}>
                      <Button size="small" type="primary" style={{ background: "#52c41a", borderColor: "#52c41a" }} icon={<CheckCircleOutlined />} onClick={() => handleDecision(item.id, "APPROVED")}>Approve</Button>
                      <Button size="small" icon={<ClockCircleOutlined />} onClick={() => handleDecision(item.id, "WAIT")}>Wait</Button>
                      <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleDecision(item.id, "DECLINED")} />
                    </Space>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
