"use client";

import React, { useState, useEffect } from "react";
import { Button, Col, Form, Input, Modal, Row, Select, Spin, Table, Tag, Typography } from "antd";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { PhotoCapture } from "@/components/ui/photo-capture";
import { toast } from "sonner";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  department?: { name: string } | null;
  branch?: { name: string } | null;
  createdAt: string;
}

function exportUsersCSV(users: User[]) {
  const headers = ["Name", "Email", "Role", "Department", "Status", "Joined"];
  const rows = users.map((u) => [
    `${u.firstName} ${u.lastName}`,
    u.email,
    u.role,
    u.department?.name || "",
    u.isActive ? "Active" : "Inactive",
    new Date(u.createdAt).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface DeptOption { id: string; name: string }
interface BranchOption { id: string; name: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetch("/api/public/departments").then(r => r.json()).then(setDepartments).catch(() => {});
    fetch("/api/admin/branches").then(r => r.json()).then(d => setBranches(d.branches || d)).catch(() => {});
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  async function createUser(values: Record<string, string>) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create user");
        return;
      }
      toast.success("User created successfully");
      setShowCreate(false);
      form.resetFields();
      fetchUsers();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: "Name", key: "name",
      render: (_, u) => (
        <div>
          <Text strong>{u.firstName} {u.lastName}</Text>
          {u.department && <div><Text type="secondary" style={{ fontSize: 12 }}>{u.department.name}</Text></div>}
        </div>
      ),
      sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Role", dataIndex: "role", key: "role", render: (r: string) => <Tag color="blue">{r.replace("_", " ")}</Tag>,
      filters: ["ADMIN","SECURITY","RECEPTIONIST","STAFF","DEPARTMENT_HEAD"].map(r => ({ text: r.replace("_"," "), value: r })),
      onFilter: (v, record) => record.role === v,
    },
    { title: "Branch", key: "branch", render: (_: unknown, u: User) => u.branch?.name || "-" },
    { title: "Status", dataIndex: "isActive", key: "status", render: (v: boolean) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag> },
    { title: "Joined", dataIndex: "createdAt", key: "joined", render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>User Management</Title>
          <Text type="secondary">{users.length} users total</Text>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button icon={<DownloadOutlined />} onClick={() => exportUsersCSV(users)}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>Add User</Button>
        </div>
      </div>

      <Table<User> columns={columns} dataSource={users} rowKey="id" pagination={{ pageSize: 20, showSizeChanger: true }} />

      <Modal title="Create New User" open={showCreate} onCancel={() => setShowCreate(false)} onOk={() => form.submit()} confirmLoading={isSubmitting} okText="Create User">
        <Form form={form} layout="vertical" onFinish={createUser}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}><Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="role" label="Role" initialValue="STAFF">
                <Select options={[
                  { label: "Admin", value: "ADMIN" },
                  { label: "Security", value: "SECURITY" },
                  { label: "Receptionist", value: "RECEPTIONIST" },
                  { label: "Staff", value: "STAFF" },
                  { label: "Department Head", value: "DEPARTMENT_HEAD" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="branchId" label="Branch" rules={[{ required: true, message: "Branch is required" }]}>
                <Select placeholder="Select branch" allowClear options={branches.map(b => ({ label: b.name, value: b.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="departmentId" label="Department" help="Required for Staff and Department Head roles">
            <Select placeholder="Select department" allowClear showSearch optionFilterProp="label"
              options={departments.map(d => ({ label: d.name, value: d.id }))} />
          </Form.Item>
          <Form.Item name="image" label="Profile Photo">
            <PhotoCapture />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
