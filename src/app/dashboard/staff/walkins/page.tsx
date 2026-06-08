"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Empty, Input, List, Modal, Space, Spin, Tag, Typography } from "antd";
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, MessageOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import LiveChat from "@/components/dashboard/live-chat";

const { Title, Text } = Typography;

const decisionTagColor: Record<string, string> = {
  PENDING: "warning", APPROVED: "success", WAIT: "processing", DECLINED: "error", RESCHEDULED: "purple",
};

interface WalkInRequest {
  id: string;
  decision: string;
  purpose: string;
  createdAt: string;
  visitor: { firstName: string; lastName: string; phone: string; company?: string };
}

export default function StaffWalkInsPage() {
  const [walkIns, setWalkIns] = useState<WalkInRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWalkIn, setSelectedWalkIn] = useState<WalkInRequest | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatWalkIn, setChatWalkIn] = useState<WalkInRequest | null>(null);

  useEffect(() => { fetchWalkIns(); }, []);

  async function fetchWalkIns() {
    try {
      const res = await fetch("/api/walkins");
      const data = await res.json();
      setWalkIns(data);
    } catch {
      toast.error("Failed to load walk-in requests");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDecision(decision: string) {
    if (!selectedWalkIn) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/walkins/${selectedWalkIn.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: decisionNote }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Failed"); return; }
      toast.success(`Walk-in request ${decision.toLowerCase()}`);
      setSelectedWalkIn(null); setDecisionNote("");
      fetchWalkIns();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  const pendingWalkIns = walkIns.filter((w) => w.decision === "PENDING");
  const resolvedWalkIns = walkIns.filter((w) => w.decision !== "PENDING");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Walk-In Requests</Title>
        <Text type="secondary">Manage walk-in visitor approval requests</Text>
      </div>

      {pendingWalkIns.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ color: "#fa8c16" }}>Pending ({pendingWalkIns.length})</Title>
          <List
            dataSource={pendingWalkIns}
            renderItem={(walkIn) => (
              <List.Item
                key={walkIn.id}
                style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #ffd591" }}
                actions={[
                  <Button key="approve" size="small" type="primary" style={{ background: "#52c41a", borderColor: "#52c41a" }} icon={<CheckCircleOutlined />} onClick={() => { setSelectedWalkIn(walkIn); handleDecision("APPROVED"); }} disabled={isSubmitting}>See Now</Button>,
                  <Button key="chat" size="small" icon={<MessageOutlined />} onClick={() => setChatWalkIn(walkIn)}>Chat</Button>,
                  <Button key="options" size="small" icon={<ClockCircleOutlined />} onClick={() => setSelectedWalkIn(walkIn)}>Options</Button>,
                ]}
              >
                <List.Item.Meta
                  title={<><Text strong>{walkIn.visitor.firstName} {walkIn.visitor.lastName}</Text> {walkIn.visitor.company && <Text type="secondary">({walkIn.visitor.company})</Text>}</>}
                  description={<><Text type="secondary">Phone: {walkIn.visitor.phone}</Text><br /><Text>Purpose: {walkIn.purpose}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{new Date(walkIn.createdAt).toLocaleString()}</Text></>}
                />
              </List.Item>
            )}
          />
        </div>
      ) : (
        <Card style={{ marginBottom: 24 }}><Empty description="No pending walk-in requests" /></Card>
      )}

      {resolvedWalkIns.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>History</Title>
          <List
            dataSource={resolvedWalkIns}
            renderItem={(walkIn) => (
              <List.Item key={walkIn.id} style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }}
                actions={[
                  <Button key="chat" type="text" size="small" icon={<MessageOutlined />} onClick={() => setChatWalkIn(walkIn)} />,
                  <Tag key="status" color={decisionTagColor[walkIn.decision] || "default"}>{walkIn.decision}</Tag>,
                ]}
              >
                <List.Item.Meta title={<Text strong>{walkIn.visitor.firstName} {walkIn.visitor.lastName}</Text>} description={<Text type="secondary">{walkIn.purpose}</Text>} />
              </List.Item>
            )}
          />
        </div>
      )}

      {chatWalkIn && (
        <div style={{ maxWidth: 500 }}>
          <LiveChat walkInRequestId={chatWalkIn.id} visitorName={`${chatWalkIn.visitor.firstName} ${chatWalkIn.visitor.lastName}`} onClose={() => setChatWalkIn(null)} />
        </div>
      )}

      <Modal title="Walk-In Decision" open={!!selectedWalkIn && !isSubmitting} onCancel={() => setSelectedWalkIn(null)} footer={null}>
        {selectedWalkIn && <Text type="secondary">{selectedWalkIn.visitor.firstName} {selectedWalkIn.visitor.lastName} - {selectedWalkIn.purpose}</Text>}
        <div style={{ margin: "16px 0" }}>
          <Input.TextArea placeholder="Add a note (optional)..." value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} rows={3} />
        </div>
        <Space wrap>
          <Button type="primary" style={{ background: "#52c41a", borderColor: "#52c41a" }} icon={<CheckCircleOutlined />} onClick={() => handleDecision("APPROVED")} loading={isSubmitting}>See Now</Button>
          <Button icon={<ClockCircleOutlined />} onClick={() => handleDecision("WAIT")} disabled={isSubmitting}>Ask to Wait</Button>
          <Button icon={<CalendarOutlined />} onClick={() => handleDecision("RESCHEDULED")} disabled={isSubmitting}>Reschedule</Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={() => handleDecision("DECLINED")} disabled={isSubmitting}>Decline</Button>
        </Space>
      </Modal>
    </div>
  );
}
