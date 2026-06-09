"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Col, Form, Input, Modal, Row, Table, Tag, Typography, Space, Empty } from "antd";
import { PlusOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { PhotoCapture } from "@/components/ui/photo-capture";
import { toast } from "sonner";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface PreRegistration {
  id: string;
  appointmentCode: string;
  purpose: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  visitor: { id: string; firstName: string; lastName: string; phone: string; email?: string; company?: string };
  department?: { name: string } | null;
}

const statusColor: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  DECLINED: "error",
  CANCELLED: "default",
  COMPLETED: "blue",
  CHECKED_IN: "processing",
};

export default function StaffPreRegisterPage() {
  const [registrations, setRegistrations] = useState<PreRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailItem, setDetailItem] = useState<PreRegistration | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/appointments/pre-register");
      if (res.ok) setRegistrations(await res.json());
    } catch { toast.error("Failed to load"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate(values: Record<string, string>) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/appointments/pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed");
        return;
      }
      toast.success("Visitor pre-registered successfully");
      setShowCreate(false);
      form.resetFields();
      fetchData();
    } catch { toast.error("Something went wrong"); }
    finally { setIsSubmitting(false); }
  }

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) { toast.success("Cancelled"); fetchData(); }
      else toast.error("Failed to cancel");
    } catch { toast.error("Error"); }
  }

  const columns: ColumnsType<PreRegistration> = [
    {
      title: "Visitor", key: "visitor",
      render: (_, r) => (
        <div>
          <Text strong>{r.visitor.firstName} {r.visitor.lastName}</Text>
          <br /><Text type="secondary" style={{ fontSize: 12 }}>{r.visitor.phone}{r.visitor.company ? ` · ${r.visitor.company}` : ""}</Text>
        </div>
      ),
    },
    { title: "Purpose", dataIndex: "purpose", key: "purpose", ellipsis: true },
    {
      title: "Date & Time", key: "datetime",
      render: (_, r) => (
        <div>
          <Text>{new Date(r.date).toLocaleDateString()}</Text>
          <br /><Text type="secondary" style={{ fontSize: 12 }}>{new Date(r.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(r.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        </div>
      ),
    },
    { title: "Code", dataIndex: "appointmentCode", key: "code", render: (v: string) => <Tag style={{ fontFamily: "monospace" }}>{v}</Tag> },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (s: string) => <Tag color={statusColor[s] || "default"}>{s}</Tag>,
      filters: Object.keys(statusColor).map(s => ({ text: s, value: s })),
      onFilter: (v, r) => r.status === v,
    },
    {
      title: "Actions", key: "actions",
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailItem(r)} />
          {["PENDING", "APPROVED"].includes(r.status) && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleCancel(r.id)} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Pre-Register Visitors</Title>
          <Text type="secondary">Register visitors ahead of their arrival</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchData} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>Pre-Register</Button>
        </Space>
      </div>

      <Card>
        <Table<PreRegistration>
          columns={columns}
          dataSource={registrations}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          locale={{ emptyText: <Empty description="No pre-registered visitors" /> }}
        />
      </Card>

      {/* Create Modal */}
      <Modal title="Pre-Register a Visitor" open={showCreate} onCancel={() => setShowCreate(false)} footer={null} destroyOnClose width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input type="email" /></Form.Item></Col>
          </Row>
          <Form.Item name="company" label="Company"><Input /></Form.Item>
          <Form.Item name="purpose" label="Purpose of Visit" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="date" label="Date" rules={[{ required: true }]}><Input type="date" min={new Date().toISOString().split("T")[0]} /></Form.Item></Col>
            <Col span={8}><Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}><Input type="time" /></Form.Item></Col>
            <Col span={8}><Form.Item name="endTime" label="End Time" rules={[{ required: true }]}><Input type="time" /></Form.Item></Col>
          </Row>
          <Form.Item name="photo" label="Visitor Photo">
            <PhotoCapture />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={isSubmitting}>Pre-Register Visitor</Button>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal title="Visitor Details" open={!!detailItem} onCancel={() => setDetailItem(null)} footer={null}>
        {detailItem && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 16 }}>{detailItem.visitor.firstName} {detailItem.visitor.lastName}</Text>
              <Tag color={statusColor[detailItem.status]} style={{ marginLeft: 8 }}>{detailItem.status}</Tag>
            </div>
            <Row gutter={[12, 8]}>
              <Col span={12}><Text type="secondary">Phone:</Text> <Text>{detailItem.visitor.phone}</Text></Col>
              <Col span={12}><Text type="secondary">Email:</Text> <Text>{detailItem.visitor.email || "-"}</Text></Col>
              <Col span={12}><Text type="secondary">Company:</Text> <Text>{detailItem.visitor.company || "-"}</Text></Col>
              <Col span={12}><Text type="secondary">Code:</Text> <Text copyable style={{ fontFamily: "monospace" }}>{detailItem.appointmentCode}</Text></Col>
              <Col span={24}><Text type="secondary">Purpose:</Text> <Text>{detailItem.purpose}</Text></Col>
              <Col span={12}><Text type="secondary">Date:</Text> <Text>{new Date(detailItem.date).toLocaleDateString()}</Text></Col>
              <Col span={12}><Text type="secondary">Time:</Text> <Text>{new Date(detailItem.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(detailItem.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text></Col>
              {detailItem.notes && <Col span={24}><Text type="secondary">Notes:</Text> <Text>{detailItem.notes}</Text></Col>}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
