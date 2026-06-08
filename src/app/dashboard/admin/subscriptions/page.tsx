"use client";

import { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Switch, Table, Tag, Typography, Statistic } from "antd";
import { CrownOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface SubPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: string;
  maxUsers: number;
  maxBranches: number;
  maxVisitors: number;
  maxRooms: number;
  features: string;
  isActive: boolean;
  createdAt: string;
  subscriptions: { id: string; status: string; tenant: { name: string } }[];
}

const statusColor: Record<string, string> = {
  TRIAL: "blue",
  ACTIVE: "success",
  PAST_DUE: "warning",
  CANCELLED: "default",
  EXPIRED: "error",
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [antForm] = Form.useForm();

  useEffect(() => { fetchPlans(); }, []);

  async function fetchPlans() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function handleAdd(values: Record<string, unknown>) {
    try {
      const features = typeof values.features === "string"
        ? values.features.split(",").map((f: string) => f.trim()).filter(Boolean)
        : [];

      const res = await fetch("/api/subscriptions/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          features: JSON.stringify(features),
        }),
      });
      if (res.ok) {
        toast.success("Plan created");
        setShowAdd(false);
        antForm.resetFields();
        fetchPlans();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Failed"); }
  }

  function parseFeatures(featuresStr: string) {
    try { return JSON.parse(featuresStr) as string[]; }
    catch { return []; }
  }

  const columns: ColumnsType<SubPlan> = [
    {
      title: "Plan",
      key: "plan",
      render: (_, p) => (
        <div>
          <Text strong>{p.name}</Text>
          {p.description && <><br /><Text type="secondary" style={{ fontSize: 12 }}>{p.description}</Text></>}
        </div>
      ),
    },
    {
      title: "Price",
      key: "price",
      render: (_, p) => <Text strong>{p.currency} {p.price.toFixed(2)}/{p.interval === "yearly" ? "yr" : "mo"}</Text>,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: "Limits",
      key: "limits",
      render: (_, p) => (
        <Text style={{ fontSize: 12 }}>
          {p.maxUsers} users · {p.maxBranches} branches · {p.maxVisitors} visitors/mo · {p.maxRooms} rooms
        </Text>
      ),
    },
    {
      title: "Features",
      key: "features",
      render: (_, p) => {
        const feats = parseFeatures(p.features);
        return feats.length > 0
          ? feats.slice(0, 3).map((f) => <Tag key={f} color="blue" style={{ marginBottom: 2 }}>{f}</Tag>)
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (v: boolean) => <Tag color={v ? "success" : "default"}>{v ? "Active" : "Disabled"}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><CrownOutlined /> Subscription Plans</Title>
          <Text type="secondary">Manage SaaS subscription plans, tenants, and usage limits</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Add Plan</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Plans" value={plans.length} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Active Plans" value={plans.filter(p => p.isActive).length} valueStyle={{ color: "#52c41a" }} /></Card>
        </Col>
      </Row>

      <Card>
        <Table<SubPlan>
          columns={columns}
          dataSource={plans}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No subscription plans configured" }}
        />
      </Card>

      <Modal title="Create Subscription Plan" open={showAdd} onCancel={() => setShowAdd(false)} footer={null} destroyOnClose width={560}>
        <Form form={antForm} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="Plan Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Pro Plan" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Plan description" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="price" label="Price" rules={[{ required: true }]} initialValue={0}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Currency" initialValue="GHS">
                <Select options={[
                  { label: "GHS", value: "GHS" },
                  { label: "USD", value: "USD" },
                  { label: "EUR", value: "EUR" },
                  { label: "GBP", value: "GBP" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="interval" label="Interval" initialValue="monthly">
                <Select options={[
                  { label: "Monthly", value: "monthly" },
                  { label: "Yearly", value: "yearly" },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>Usage Limits</Title>
          <Row gutter={12}>
            <Col span={6}><Form.Item name="maxUsers" label="Max Users" initialValue={10}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="maxBranches" label="Branches" initialValue={1}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="maxVisitors" label="Visitors/mo" initialValue={500}><InputNumber min={10} style={{ width: "100%" }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="maxRooms" label="Rooms" initialValue={3}><InputNumber min={1} style={{ width: "100%" }} /></Form.Item></Col>
          </Row>

          <Form.Item name="features" label="Features (comma-separated)">
            <Input placeholder="e.g. qr_pass, watchlist, analytics, calendar_sync" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>Create Plan</Button>
        </Form>
      </Modal>
    </div>
  );
}
