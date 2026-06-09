"use client";

import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Table, Tag, Typography, Statistic, Space } from "antd";
import { PlusOutlined, ApiOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface AccessDevice {
  id: string;
  name: string;
  type: string;
  location?: string;
  branchId?: string;
  ipAddress?: string;
  apiEndpoint?: string;
  isActive: boolean;
  lastPing?: string;
  createdAt: string;
  logs: { id: string; action: string; granted: boolean; createdAt: string }[];
}

const typeTagColor: Record<string, string> = {
  turnstile: "blue",
  smart_door: "green",
  biometric: "purple",
};

export default function AccessControlPage() {
  const [devices, setDevices] = useState<AccessDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [antForm] = Form.useForm();

  useEffect(() => { fetchDevices(); }, []);

  async function fetchDevices() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/access-control");
      if (res.ok) setDevices(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function handleAdd(values: Record<string, string>) {
    try {
      const res = await fetch("/api/access-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success("Device registered");
        setShowAdd(false);
        antForm.resetFields();
        fetchDevices();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Failed"); }
  }

  const columns: ColumnsType<AccessDevice> = [
    {
      title: "Device",
      key: "device",
      render: (_, d) => (
        <div>
          <Text strong>{d.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{d.location || "No location"}</Text>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={typeTagColor[t] || "default"}>{t.replace("_", " ").toUpperCase()}</Tag>,
      filters: [
        { text: "Turnstile", value: "turnstile" },
        { text: "Smart Door", value: "smart_door" },
        { text: "Biometric", value: "biometric" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    { title: "IP Address", dataIndex: "ipAddress", key: "ipAddress", render: (v: string) => v || "—" },
    {
      title: "API Endpoint",
      dataIndex: "apiEndpoint",
      key: "apiEndpoint",
      render: (v: string) => v ? <Tag color="blue">Connected</Tag> : <Tag>None</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) => v
        ? <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
        : <Tag color="error" icon={<CloseCircleOutlined />}>Inactive</Tag>,
    },
    {
      title: "Recent Events",
      key: "logs",
      render: (_, d) => <Text type="secondary">{d.logs.length} recent</Text>,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><ApiOutlined /> Access Control Devices</Title>
          <Text type="secondary">Manage turnstiles, smart doors, and biometric integrations</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Register Device</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card size="small"><Statistic title="Total Devices" value={devices.length} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small"><Statistic title="Active" value={devices.filter(d => d.isActive).length} valueStyle={{ color: "#52c41a" }} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small"><Statistic title="With API" value={devices.filter(d => d.apiEndpoint).length} valueStyle={{ color: "#0A2540" }} /></Card>
        </Col>
      </Row>

      <Card>
        <Table<AccessDevice>
          columns={columns}
          dataSource={devices}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 600 }}
          locale={{ emptyText: "No access control devices registered" }}
        />
      </Card>

      <Modal title="Register Access Control Device" open={showAdd} onCancel={() => setShowAdd(false)} footer={null} destroyOnClose>
        <Form form={antForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="Device Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Main Entrance Turnstile" />
          </Form.Item>
          <Form.Item name="type" label="Device Type" rules={[{ required: true }]} initialValue="turnstile">
            <Select options={[
              { label: "Turnstile", value: "turnstile" },
              { label: "Smart Door", value: "smart_door" },
              { label: "Biometric", value: "biometric" },
            ]} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="location" label="Location"><Input placeholder="e.g. Ground Floor" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ipAddress" label="IP Address"><Input placeholder="e.g. 192.168.1.50" /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="apiEndpoint" label="API Endpoint">
            <Input placeholder="https://device-api.example.com/control" />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key">
            <Input.Password placeholder="Device API key (stored securely)" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Register Device</Button>
        </Form>
      </Modal>
    </div>
  );
}
