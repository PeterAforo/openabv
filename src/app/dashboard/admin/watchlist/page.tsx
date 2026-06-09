"use client";

import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Table, Tag, Typography, Statistic, Avatar } from "antd";
import { PlusOutlined, WarningOutlined, SafetyOutlined, UserOutlined } from "@ant-design/icons";
import { PhotoCapture } from "@/components/ui/photo-capture";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface WatchlistEntry {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  photo?: string;
  address?: string;
  riskLevel: string;
  reason: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  visitor?: { firstName: string; lastName: string; phone: string; photo?: string };
}

const riskTagColor: Record<string, string> = {
  LOW: "warning",
  MEDIUM: "orange",
  HIGH: "red",
  CRITICAL: "magenta",
};

export default function WatchlistPage() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [antForm] = Form.useForm();

  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) setEntries(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function handleAdd(values: Record<string, string>) {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setShowAdd(false);
        antForm.resetFields();
        fetchEntries();
      }
    } catch { /* ignore */ }
  }

  const columns: ColumnsType<WatchlistEntry> = [
    {
      title: "Person",
      key: "name",
      render: (_, entry) => {
        const photo = entry.photo || entry.visitor?.photo;
        const name = entry.visitor ? `${entry.visitor.firstName} ${entry.visitor.lastName}` : `${entry.firstName || ""} ${entry.lastName || ""}`.trim() || "Unknown";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={photo} icon={!photo ? <UserOutlined /> : undefined} size={36} />
            <div>
              <Text strong>{name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {entry.phone && `${entry.phone}`}{entry.email && ` · ${entry.email}`}
              </Text>
            </div>
          </div>
        );
      },
    },
    { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
    {
      title: "Risk Level",
      dataIndex: "riskLevel",
      key: "riskLevel",
      render: (level: string) => <Tag color={riskTagColor[level] || "default"}>{level}</Tag>,
      filters: [
        { text: "Critical", value: "CRITICAL" },
        { text: "High", value: "HIGH" },
        { text: "Medium", value: "MEDIUM" },
        { text: "Low", value: "LOW" },
      ],
      onFilter: (value, record) => record.riskLevel === value,
    },
    {
      title: "Date Added",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => new Date(d).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><SafetyOutlined style={{ color: "#ff4d4f" }} /> Watchlist / Blacklist</Title>
          <Text type="secondary">Manage flagged visitors and security alerts</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Add Entry</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Total Entries" value={entries.length} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Critical" value={entries.filter(e => e.riskLevel === "CRITICAL").length} valueStyle={{ color: "#ff4d4f" }} prefix={<WarningOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="High Risk" value={entries.filter(e => e.riskLevel === "HIGH").length} valueStyle={{ color: "#fa8c16" }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Medium/Low" value={entries.filter(e => e.riskLevel === "MEDIUM" || e.riskLevel === "LOW").length} valueStyle={{ color: "#faad14" }} /></Card>
        </Col>
      </Row>

      <Card title="Active Watchlist Entries">
        <Table<WatchlistEntry>
          columns={columns}
          dataSource={entries}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 600 }}
          locale={{ emptyText: "No watchlist entries" }}
        />
      </Card>

      <Modal
        title="Add Watchlist Entry"
        open={showAdd}
        onCancel={() => setShowAdd(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={antForm} layout="vertical" onFinish={handleAdd}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Form.Item name="photo" noStyle>
              <PhotoCapture size={90} />
            </Form.Item>
          </div>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="firstName" label="First Name"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="lastName" label="Last Name"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="idType" label="ID Type">
                <Select placeholder="Select" allowClear options={[
                  { label: "National ID", value: "NATIONAL_ID" },
                  { label: "Passport", value: "PASSPORT" },
                  { label: "Driver's License", value: "DRIVERS_LICENSE" },
                  { label: "Voter ID", value: "VOTER_ID" },
                  { label: "Company ID", value: "COMPANY_ID" },
                  { label: "Other", value: "OTHER" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="idNumber" label="ID Number"><Input /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="riskLevel" label="Risk Level" initialValue="MEDIUM">
                <Select options={[
                  { label: "Low", value: "LOW" },
                  { label: "Medium", value: "MEDIUM" },
                  { label: "High", value: "HIGH" },
                  { label: "Critical", value: "CRITICAL" },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Address">
            <Input placeholder="Known address or location" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "Reason is required" }]}>
            <Input placeholder="Why is this person flagged?" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea placeholder="Additional details..." rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Add to Watchlist</Button>
        </Form>
      </Modal>
    </div>
  );
}
