"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Spin, Tag, Typography } from "antd";
import { PlusOutlined, BankOutlined, UserOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  branch?: { name: string } | null;
  contactPerson?: { firstName: string; lastName: string } | null;
  _count: { users: number };
}

interface BranchOption { id: string; name: string }
interface StaffOption { id: string; firstName: string; lastName: string }

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDepartments();
    fetch("/api/admin/branches").then(r => r.json()).then(d => setBranches(d.branches || d)).catch(() => {});
    fetch("/api/public/staff").then(r => r.json()).then(setStaffList).catch(() => {});
  }, []);

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch {
      toast.error("Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  }

  async function createDepartment(values: { name: string; description?: string }) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create department");
        return;
      }
      toast.success("Department created");
      setShowCreate(false);
      form.resetFields();
      fetchDepartments();
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
          <Title level={3} style={{ margin: 0 }}>Departments</Title>
          <Text type="secondary">Manage organizational departments</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>Add Department</Button>
      </div>

      {departments.length === 0 ? (
        <Card><Empty description="No departments found" /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {departments.map((dept) => (
            <Col key={dept.id} xs={24} md={12} lg={8}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <Text strong style={{ fontSize: 15 }}>{dept.name}</Text>
                    {dept.description && <div><Text type="secondary">{dept.description}</Text></div>}
                    <div style={{ marginTop: 4 }}>
                      {dept.branch && <Tag icon={<BankOutlined />} color="blue">{dept.branch.name}</Tag>}
                      {dept.contactPerson && <Tag icon={<UserOutlined />}>{dept.contactPerson.firstName} {dept.contactPerson.lastName}</Tag>}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dept._count.users} staff members</Text>
                  </div>
                  <Tag color={dept.isActive ? "green" : "default"}>{dept.isActive ? "Active" : "Inactive"}</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal title="Create Department" open={showCreate} onCancel={() => setShowCreate(false)} onOk={() => form.submit()} confirmLoading={isSubmitting} okText="Create">
        <Form form={form} layout="vertical" onFinish={createDepartment}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="Department name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Optional description" rows={2} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="branchId" label="Branch">
                <Select placeholder="Select branch" allowClear
                  options={branches.map(b => ({ label: b.name, value: b.id }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPersonId" label="Contact Person" help="Main contact for official visits">
                <Select placeholder="Select staff" allowClear showSearch optionFilterProp="label"
                  options={staffList.map(s => ({ label: `${s.firstName} ${s.lastName}`, value: s.id }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
