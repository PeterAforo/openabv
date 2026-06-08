"use client";

import { useState, useEffect } from "react";
import { Button, Card, Col, Form, InputNumber, Modal, Row, Select, Table, Tag, Typography, Statistic, Alert } from "antd";
import { LockOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface RetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
  lastRunAt?: string;
  createdAt: string;
}

export default function PrivacyPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [antForm] = Form.useForm();

  useEffect(() => { fetchPolicies(); }, []);

  async function fetchPolicies() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/privacy/retention");
      if (res.ok) setPolicies(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function handleAdd(values: { entityType: string; retentionDays: number; action: string }) {
    try {
      const res = await fetch("/api/privacy/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success("Policy saved");
        setShowAdd(false);
        antForm.resetFields();
        fetchPolicies();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Failed"); }
  }

  async function handleRunCleanup() {
    Modal.confirm({
      title: "Run Data Retention Cleanup?",
      icon: <ExclamationCircleOutlined />,
      content: "This will permanently delete or anonymize records according to your active policies. This action cannot be undone.",
      okText: "Run Cleanup",
      okType: "danger",
      async onOk() {
        setIsRunning(true);
        try {
          const res = await fetch("/api/privacy/retention", { method: "DELETE" });
          if (res.ok) {
            const data = await res.json();
            toast.success(`Cleanup complete: ${JSON.stringify(data.results)}`);
            fetchPolicies();
          } else {
            toast.error("Cleanup failed");
          }
        } catch { toast.error("Cleanup failed"); }
        setIsRunning(false);
      },
    });
  }

  const columns: ColumnsType<RetentionPolicy> = [
    {
      title: "Entity Type",
      dataIndex: "entityType",
      key: "entityType",
      render: (t: string) => <Tag color="blue">{t.replace(/_/g, " ").toUpperCase()}</Tag>,
    },
    {
      title: "Retention Period",
      dataIndex: "retentionDays",
      key: "retentionDays",
      render: (d: number) => <Text strong>{d} days</Text>,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (a: string) => <Tag color={a === "delete" ? "error" : "warning"}>{a.toUpperCase()}</Tag>,
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) => <Tag color={v ? "success" : "default"}>{v ? "Active" : "Disabled"}</Tag>,
    },
    {
      title: "Last Run",
      dataIndex: "lastRunAt",
      key: "lastRunAt",
      render: (d: string | null) => d ? new Date(d).toLocaleString() : "Never",
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><LockOutlined /> Privacy & Data Retention</Title>
          <Text type="secondary">Manage GDPR/data retention policies and consent records</Text>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button danger icon={<DeleteOutlined />} loading={isRunning} onClick={handleRunCleanup}>Run Cleanup</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Add Policy</Button>
        </div>
      </div>

      <Alert
        message="Data Retention Policies"
        description="Configure how long visitor data, photos, and documents are retained. After the retention period, records will be automatically deleted or anonymized based on the selected action."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card size="small"><Statistic title="Active Policies" value={policies.filter(p => p.isActive).length} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small"><Statistic title="Delete Policies" value={policies.filter(p => p.action === "delete").length} valueStyle={{ color: "#ff4d4f" }} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small"><Statistic title="Anonymize Policies" value={policies.filter(p => p.action === "anonymize").length} valueStyle={{ color: "#faad14" }} /></Card>
        </Col>
      </Row>

      <Card>
        <Table<RetentionPolicy>
          columns={columns}
          dataSource={policies}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: "No retention policies configured" }}
        />
      </Card>

      <Modal title="Add/Update Retention Policy" open={showAdd} onCancel={() => setShowAdd(false)} footer={null} destroyOnClose>
        <Form form={antForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="entityType" label="Entity Type" rules={[{ required: true }]}>
            <Select placeholder="Select data type" options={[
              { label: "Visitor Logs", value: "visitor_log" },
              { label: "Visitor Photos", value: "visitor_photo" },
              { label: "Documents", value: "documents" },
              { label: "Consent Records", value: "consent_records" },
              { label: "Audit Logs", value: "audit_logs" },
              { label: "Chat Messages", value: "chat_messages" },
            ]} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="retentionDays" label="Retention Days" rules={[{ required: true }]} initialValue={365}>
                <InputNumber min={30} max={3650} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="action" label="Action" rules={[{ required: true }]} initialValue="anonymize">
                <Select options={[
                  { label: "Delete", value: "delete" },
                  { label: "Anonymize", value: "anonymize" },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" block>Save Policy</Button>
        </Form>
      </Modal>
    </div>
  );
}
