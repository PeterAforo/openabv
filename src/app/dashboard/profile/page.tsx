"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, Button, Card, Col, Input, Row, Spin, Tag, Typography } from "antd";
import { LockOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: session?.user?.name?.split(" ")[0] || "",
    lastName: session?.user?.name?.split(" ").slice(1).join(" ") || "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!session?.user) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  const user = session.user;
  const initials = user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";

  async function handleUpdateProfile() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Failed to update profile"); return; }
      toast.success("Profile updated");
      await update();
    } catch { toast.error("Something went wrong"); } finally { setIsLoading(false); }
  }

  async function handleChangePassword() {
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Failed to change password"); return; }
      toast.success("Password changed successfully");
      setForm((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch { toast.error("Something went wrong"); } finally { setIsLoading(false); }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Profile</Title>
        <Text type="secondary">Manage your account settings</Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar size={64} src={user.image || undefined} icon={<UserOutlined />} style={{ background: "#1677ff" }}>{initials}</Avatar>
          <div>
            <Title level={4} style={{ margin: 0 }}>{user.name}</Title>
            <Text type="secondary">{user.email}</Text>
            <div style={{ marginTop: 4 }}><Tag>{user.role.replace("_", " ")}</Tag></div>
          </div>
        </div>
      </Card>

      <Card title="Personal Information" extra={<Text type="secondary">Update your name and contact details</Text>} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>First Name</Text>
              <Input value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
            </Col>
            <Col span={12}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>Last Name</Text>
              <Input value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
            </Col>
          </Row>
          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>Email</Text>
            <Input value={user.email} disabled />
          </div>
          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>Phone</Text>
            <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Enter phone number" />
          </div>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleUpdateProfile} loading={isLoading}>Save Changes</Button>
        </div>
      </Card>

      <Card title="Change Password" extra={<Text type="secondary">Update your password</Text>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>Current Password</Text>
            <Input.Password value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>New Password</Text>
              <Input.Password value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} />
            </Col>
            <Col span={12}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>Confirm New Password</Text>
              <Input.Password value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
            </Col>
          </Row>
          <Button icon={<LockOutlined />} onClick={handleChangePassword} loading={isLoading}>Change Password</Button>
        </div>
      </Card>
    </div>
  );
}
