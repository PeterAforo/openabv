"use client";

import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Switch, Table, Tag, Typography } from "antd";
import { PlusOutlined, ThunderboltOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface ApprovalRule {
  id: string;
  name: string;
  description?: string;
  conditions: string;
  action: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const actionTagColor: Record<string, string> = {
  auto_approve: "success",
  require_approval: "processing",
  block: "error",
};

export default function ApprovalRulesPage() {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [antForm] = Form.useForm();

  useEffect(() => { fetchRules(); }, []);

  async function fetchRules() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/approval-rules");
      if (res.ok) setRules(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function handleAdd(values: Record<string, unknown>) {
    const conditions: Record<string, unknown> = {};
    if (values.visitorTypes) conditions.visitorType = values.visitorTypes;
    if (values.blockOutsideHours) conditions.blockOutsideHours = true;
    if (values.timeStart && values.timeEnd) conditions.timeRange = { start: values.timeStart, end: values.timeEnd };
    if (values.maxDailyVisits) conditions.maxDailyVisits = values.maxDailyVisits;
    if (values.trustedVisitor) conditions.trustedVisitor = true;

    try {
      const res = await fetch("/api/approval-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          conditions,
          action: values.action,
          priority: values.priority || 0,
        }),
      });
      if (res.ok) {
        toast.success("Rule created");
        setShowAdd(false);
        antForm.resetFields();
        fetchRules();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create rule");
      }
    } catch { toast.error("Failed"); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/approval-rules?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Rule deleted"); fetchRules(); }
    } catch { toast.error("Failed"); }
  }

  function parseConditions(condStr: string) {
    try {
      const c = JSON.parse(condStr);
      const parts: string[] = [];
      if (c.visitorType?.length) parts.push(`Types: ${c.visitorType.join(", ")}`);
      if (c.blockOutsideHours) parts.push("Block outside hours");
      if (c.timeRange) parts.push(`Hours: ${c.timeRange.start}-${c.timeRange.end}`);
      if (c.maxDailyVisits) parts.push(`Max ${c.maxDailyVisits}/day`);
      if (c.trustedVisitor) parts.push("Trusted visitors (3+ visits)");
      return parts.join(" · ") || "No conditions";
    } catch { return condStr; }
  }

  const columns: ColumnsType<ApprovalRule> = [
    { title: "Priority", dataIndex: "priority", key: "priority", width: 80, sorter: (a, b) => b.priority - a.priority, render: (v: number) => <Tag>{v}</Tag> },
    {
      title: "Rule",
      key: "rule",
      render: (_, r) => (
        <div>
          <Text strong>{r.name}</Text>
          {r.description && <><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text></>}
        </div>
      ),
    },
    { title: "Conditions", key: "conditions", render: (_, r) => <Text style={{ fontSize: 12 }}>{parseConditions(r.conditions)}</Text> },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (a: string) => <Tag color={actionTagColor[a] || "default"}>{a.replace("_", " ").toUpperCase()}</Tag>,
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) => <Tag color={v ? "success" : "default"}>{v ? "Active" : "Disabled"}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_, r) => <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(r.id)} />,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><ThunderboltOutlined /> Smart Approval Rules</Title>
          <Text type="secondary">Configure automatic visitor approval, blocking, and routing logic</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Add Rule</Button>
      </div>

      <Card>
        <Table<ApprovalRule>
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No approval rules configured" }}
        />
      </Card>

      <Modal title="Add Approval Rule" open={showAdd} onCancel={() => setShowAdd(false)} footer={null} destroyOnClose width={560}>
        <Form form={antForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Auto-approve VIPs" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Optional description" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="action" label="Action" rules={[{ required: true }]} initialValue="require_approval">
                <Select options={[
                  { label: "Auto Approve", value: "auto_approve" },
                  { label: "Require Approval", value: "require_approval" },
                  { label: "Block", value: "block" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue={0}>
                <InputNumber min={0} max={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Conditions</Title>

          <Form.Item name="visitorTypes" label="Visitor Types">
            <Select mode="multiple" placeholder="Apply to specific types..." options={[
              { label: "Guest", value: "GUEST" },
              { label: "Contractor", value: "CONTRACTOR" },
              { label: "Vendor", value: "VENDOR" },
              { label: "Delivery", value: "DELIVERY" },
              { label: "VIP", value: "VIP" },
              { label: "Staff Guest", value: "STAFF_GUEST" },
            ]} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="blockOutsideHours" label="Block Outside Hours" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="timeStart" label="Start Hour">
                <Input placeholder="08:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="timeEnd" label="End Hour">
                <Input placeholder="17:00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="maxDailyVisits" label="Max Daily Visits per Staff">
                <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 10" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="trustedVisitor" label="Auto-approve Trusted" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" block>Create Rule</Button>
        </Form>
      </Modal>
    </div>
  );
}
