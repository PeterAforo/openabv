"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, List, Row, Select, Tag, Typography } from "antd";
import { MessageOutlined, UserAddOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import LiveChat from "@/components/dashboard/live-chat";

const { Title, Text } = Typography;

const decisionTagColor: Record<string, string> = {
  PENDING: "warning", APPROVED: "success", WAIT: "processing", DECLINED: "error", RESCHEDULED: "purple",
};

interface StaffMember { id: string; firstName: string; lastName: string; department: { name: string } | null; }
interface RecentWalkIn { id: string; decision: string; purpose: string; createdAt: string; visitor: { firstName: string; lastName: string; phone: string }; recipient: { firstName: string; lastName: string }; }

export default function ReceptionistWalkinPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentWalkIns, setRecentWalkIns] = useState<RecentWalkIn[]>([]);
  const [chatWalkIn, setChatWalkIn] = useState<RecentWalkIn | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch("/api/public/staff").then((r) => r.json()).then((d) => setStaff(d.staff || [])).catch(() => toast.error("Failed to load staff list"));
    fetchRecentWalkIns();
  }, []);

  async function fetchRecentWalkIns() {
    try { const res = await fetch("/api/walkins"); if (res.ok) { const d = await res.json(); setRecentWalkIns(d.slice(0, 20)); } } catch { /* ignore */ }
  }

  async function handleSubmit(values: Record<string, string>) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/walkins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Registration failed"); return; }
      toast.success("Walk-in registered. Notification sent to recipient.");
      fetchRecentWalkIns();
      form.resetFields();
    } catch { toast.error("Something went wrong"); } finally { setIsSubmitting(false); }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Walk-In Registration</Title>
        <Text type="secondary">Register walk-in visitors and notify staff</Text>
      </div>

      <Card title="Visitor Information" style={{ maxWidth: 700 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input type="email" /></Form.Item></Col>
          </Row>
          <Form.Item name="company" label="Company"><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="idType" label="ID Type" initialValue="NATIONAL_ID">
                <Select options={[{ label: "National ID", value: "NATIONAL_ID" }, { label: "Passport", value: "PASSPORT" }, { label: "Driver's License", value: "DRIVERS_LICENSE" }, { label: "Voter ID", value: "VOTER_ID" }]} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="idNumber" label="ID Number"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="recipientId" label="Who are you visiting?" rules={[{ required: true }]}>
            <Select placeholder="Select staff member" showSearch optionFilterProp="label"
              options={staff.map((s) => ({ label: `${s.firstName} ${s.lastName}${s.department ? ` (${s.department.name})` : ""}`, value: s.id }))} />
          </Form.Item>
          <Form.Item name="purpose" label="Purpose" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block icon={<UserAddOutlined />} loading={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register Walk-In"}
          </Button>
        </Form>
      </Card>

      {recentWalkIns.length > 0 && (
        <Card title="Recent Walk-Ins" style={{ marginTop: 24 }}>
          <List dataSource={recentWalkIns} renderItem={(w) => (
            <List.Item key={w.id} style={{ padding: "8px 0" }} actions={[
              <Button key="chat" type="text" size="small" icon={<MessageOutlined />} onClick={() => setChatWalkIn(w)} />,
              <Tag key="status" color={decisionTagColor[w.decision] || "default"}>{w.decision}</Tag>,
            ]}>
              <List.Item.Meta title={<Text strong>{w.visitor.firstName} {w.visitor.lastName}</Text>} description={<Text type="secondary">To: {w.recipient.firstName} {w.recipient.lastName} · {w.purpose}</Text>} />
            </List.Item>
          )} />
        </Card>
      )}

      {chatWalkIn && (
        <div style={{ maxWidth: 500, marginTop: 24 }}>
          <LiveChat walkInRequestId={chatWalkIn.id} visitorName={`${chatWalkIn.visitor.firstName} ${chatWalkIn.visitor.lastName}`} onClose={() => setChatWalkIn(null)} />
        </div>
      )}
    </div>
  );
}
