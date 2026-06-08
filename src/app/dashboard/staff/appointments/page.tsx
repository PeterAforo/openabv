"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Empty, Input, List, Modal, Row, Space, Spin, Tag, Typography } from "antd";
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

const statusTagColor: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  DECLINED: "error",
  COMPLETED: "default",
  RESCHEDULED: "purple",
  NO_SHOW: "red",
};

interface Appointment {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  notes?: string;
  visitor: { firstName: string; lastName: string; phone: string; email?: string; company?: string };
}

export default function StaffAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [decisionType, setDecisionType] = useState<string>("");
  const [reason, setReason] = useState("");
  const [rescheduledDate, setRescheduledDate] = useState("");
  const [rescheduledTime, setRescheduledTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchAppointments(); }, []);

  async function fetchAppointments() {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDecision() {
    if (!selectedApt || !decisionType) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${selectedApt.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionType, reason,
          rescheduledDate: decisionType === "RESCHEDULED" ? rescheduledDate : undefined,
          rescheduledTime: decisionType === "RESCHEDULED" ? rescheduledTime : undefined,
        }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Failed"); return; }
      toast.success(`Appointment ${decisionType.toLowerCase()}`);
      setSelectedApt(null); setDecisionType(""); setReason("");
      fetchAppointments();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  const pendingAppts = appointments.filter((a) => a.status === "PENDING");
  const otherAppts = appointments.filter((a) => a.status !== "PENDING");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>My Appointments</Title>
        <Text type="secondary">Manage your appointment requests</Text>
      </div>

      {pendingAppts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ color: "#fa8c16" }}>Pending Approval ({pendingAppts.length})</Title>
          <List
            dataSource={pendingAppts}
            renderItem={(apt) => (
              <List.Item
                key={apt.id}
                style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #ffd591" }}
                actions={[
                  <Button key="approve" size="small" type="primary" style={{ background: "#52c41a", borderColor: "#52c41a" }} icon={<CheckCircleOutlined />} onClick={() => { setSelectedApt(apt); setDecisionType("APPROVED"); }} />,
                  <Button key="reschedule" size="small" icon={<CalendarOutlined />} onClick={() => { setSelectedApt(apt); setDecisionType("RESCHEDULED"); }} />,
                  <Button key="decline" size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setSelectedApt(apt); setDecisionType("DECLINED"); }} />,
                ]}
              >
                <List.Item.Meta
                  title={<><Text strong>{apt.visitor.firstName} {apt.visitor.lastName}</Text> {apt.visitor.company && <Text type="secondary">({apt.visitor.company})</Text>}</>}
                  description={<>
                    <Text>Purpose: {apt.purpose}</Text><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{new Date(apt.date).toLocaleDateString()} | {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(apt.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                  </>}
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {otherAppts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5}>All Appointments</Title>
          <List
            dataSource={otherAppts}
            renderItem={(apt) => (
              <List.Item key={apt.id} style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }} actions={[<Tag key="status" color={statusTagColor[apt.status] || "default"}>{apt.status}</Tag>]}>
                <List.Item.Meta
                  title={<Text strong>{apt.visitor.firstName} {apt.visitor.lastName}</Text>}
                  description={<Text type="secondary">{new Date(apt.date).toLocaleDateString()} - {apt.purpose}</Text>}
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {appointments.length === 0 && <Card><Empty description="No appointments yet" /></Card>}

      <Modal
        title={decisionType === "APPROVED" ? "Approve Appointment" : decisionType === "DECLINED" ? "Decline Appointment" : "Reschedule Appointment"}
        open={!!selectedApt && !!decisionType}
        onCancel={() => { setSelectedApt(null); setDecisionType(""); }}
        onOk={handleDecision}
        confirmLoading={isSubmitting}
        okText="Confirm"
      >
        {selectedApt && <Text type="secondary">{selectedApt.visitor.firstName} {selectedApt.visitor.lastName} - {selectedApt.purpose}</Text>}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {decisionType === "RESCHEDULED" && (
            <Row gutter={12}>
              <Col span={12}>
                <Text strong style={{ display: "block", marginBottom: 4 }}>New Date</Text>
                <Input type="date" value={rescheduledDate} onChange={(e) => setRescheduledDate(e.target.value)} />
              </Col>
              <Col span={12}>
                <Text strong style={{ display: "block", marginBottom: 4 }}>New Time</Text>
                <Input type="time" value={rescheduledTime} onChange={(e) => setRescheduledTime(e.target.value)} />
              </Col>
            </Row>
          )}
          {decisionType !== "APPROVED" && (
            <div>
              <Text strong style={{ display: "block", marginBottom: 4 }}>Reason {decisionType === "DECLINED" ? "(required)" : "(optional)"}</Text>
              <Input.TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason..." rows={3} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
