"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Spin, Tag, Typography } from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface Branch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  isActive: boolean;
  _count: { users: number };
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { fetchBranches(); }, []);

  async function fetchBranches() {
    try {
      const res = await fetch("/api/admin/branches");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBranches(data.branches || []);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  }

  async function createBranch(values: Record<string, string>) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create branch");
        return;
      }
      toast.success("Branch created");
      setShowCreate(false);
      form.resetFields();
      fetchBranches();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Branches</Title>
          <Text type="secondary">Manage organization branches</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>Add Branch</Button>
      </div>

      {branches.length === 0 ? (
        <Card><Empty description="No branches found" /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {branches.map((branch) => (
            <Col xs={24} md={12} lg={8} key={branch.id}>
              <Card hoverable>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{branch.name}</Text>
                    {branch.address && <div><Text type="secondary">{branch.address}</Text></div>}
                    {branch.city && <div><Text type="secondary">{branch.city}</Text></div>}
                    {branch.phone && <div><Text type="secondary">{branch.phone}</Text></div>}
                    <div style={{ marginTop: 8 }}><Text type="secondary"><TeamOutlined /> {branch._count.users} staff members</Text></div>
                  </div>
                  <Tag color={branch.isActive ? "green" : "default"}>{branch.isActive ? "Active" : "Inactive"}</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal title="Create Branch" open={showCreate} onCancel={() => setShowCreate(false)} onOk={() => form.submit()} confirmLoading={isSubmitting} okText="Create">
        <Form form={form} layout="vertical" onFinish={createBranch}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}><Input placeholder="Branch name" /></Form.Item>
          <Form.Item name="address" label="Address"><Input placeholder="Street address" /></Form.Item>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="city" label="City"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
