"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Col, Empty, Modal, Row, Space, Spin, Statistic, Tag, Typography, Input } from "antd";
import { ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, TeamOutlined, EyeOutlined, CalendarOutlined, PhoneOutlined } from "@ant-design/icons";
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
  WAIT: "#0A2540",
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
  const [detailItem, setDetailItem] = useState<QueueItem | null>(null);
  const [postponeId, setPostponeId] = useState<string | null>(null);
  const [postponeNote, setPostponeNote] = useState("");

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

  async function handleDecision(id: string, decision: string, note = "") {
    try {
      const res = await fetch(`/api/walkins/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      if (res.ok) {
        toast.success(`Visitor ${decision.toLowerCase()}`);
        setPostponeId(null);
        setPostponeNote("");
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
          <Card size="small"><Statistic title="Asked to Wait" value={waitingCount} valueStyle={{ color: "#0A2540" }} /></Card>
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

                  {(item.decision === "PENDING" || item.decision === "WAIT") && (
                    <Space size={4} wrap>
                      {item.decision === "PENDING" && (
                        <Button size="small" type="primary" style={{ background: "#52c41a", borderColor: "#52c41a" }} icon={<CheckCircleOutlined />} onClick={() => handleDecision(item.id, "APPROVED")}>Approve</Button>
                      )}
                      {item.decision === "PENDING" && (
                        <Button size="small" icon={<ClockCircleOutlined />} onClick={() => handleDecision(item.id, "WAIT")}>Wait</Button>
                      )}
                      <Button size="small" icon={<CalendarOutlined />} onClick={() => setPostponeId(item.id)}>Postpone</Button>
                      <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailItem(item)} />
                      {item.decision === "PENDING" && (
                        <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleDecision(item.id, "DECLINED")} />
                      )}
                    </Space>
                  )}
                  {item.decision === "APPROVED" && (
                    <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailItem(item)}>Details</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal title="Visitor Details" open={!!detailItem} onCancel={() => setDetailItem(null)} footer={null} width={500}>
        {detailItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Text strong style={{ fontSize: 16 }}>{detailItem.visitor.firstName} {detailItem.visitor.lastName}</Text>
              <Tag color={decisionTagColor[detailItem.decision]} style={{ marginLeft: 8 }}>{detailItem.decision}</Tag>
            </div>
            <Row gutter={[12, 8]}>
              <Col span={12}><Text type="secondary"><PhoneOutlined /> Phone:</Text><br /><Text>{detailItem.visitor.phone}</Text></Col>
              <Col span={12}><Text type="secondary">Company:</Text><br /><Text>{detailItem.visitor.company || "-"}</Text></Col>
              <Col span={12}><Text type="secondary">Visiting:</Text><br /><Text strong>{detailItem.recipient.firstName} {detailItem.recipient.lastName}</Text></Col>
              <Col span={12}><Text type="secondary">Department:</Text><br /><Text>{detailItem.recipient.department?.name || "-"}</Text></Col>
              <Col span={24}><Text type="secondary">Purpose:</Text><br /><Text>{detailItem.purpose}</Text></Col>
              <Col span={12}><Text type="secondary">Arrived:</Text><br /><Text>{new Date(detailItem.createdAt).toLocaleString()}</Text></Col>
              <Col span={12}><Text type="secondary">Wait Time:</Text><br /><Tag icon={<ClockCircleOutlined />} color="orange">{formatWaitTime(detailItem.waitTimeMinutes)}</Tag></Col>
              {detailItem.decisionNote && <Col span={24}><Text type="secondary">Note:</Text><br /><Text italic>{detailItem.decisionNote}</Text></Col>}
            </Row>
            {detailItem.decision === "PENDING" && (
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" style={{ background: "#52c41a", borderColor: "#52c41a" }} onClick={() => { handleDecision(detailItem.id, "APPROVED"); setDetailItem(null); }}>Approve</Button>
                <Button onClick={() => { handleDecision(detailItem.id, "WAIT"); setDetailItem(null); }}>Ask to Wait</Button>
                <Button danger onClick={() => { handleDecision(detailItem.id, "DECLINED"); setDetailItem(null); }}>Decline</Button>
              </Space>
            )}
          </div>
        )}
      </Modal>

      {/* Postpone Modal */}
      <Modal
        title="Postpone Visitor"
        open={!!postponeId}
        onCancel={() => { setPostponeId(null); setPostponeNote(""); }}
        onOk={() => { if (postponeId) handleDecision(postponeId, "RESCHEDULED", postponeNote); }}
        okText="Postpone"
      >
        <Text>Ask the visitor to come back at a later time.</Text>
        <Input.TextArea
          value={postponeNote}
          onChange={e => setPostponeNote(e.target.value)}
          placeholder="e.g., Please come back at 2:00 PM — the host is in a meeting."
          rows={3}
          style={{ marginTop: 12 }}
        />
      </Modal>
    </div>
  );
}
