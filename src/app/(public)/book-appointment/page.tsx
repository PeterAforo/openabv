"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, Result, Row, Select, Typography } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import Link from "next/link";

const { Title, Text } = Typography;

interface StaffOption { id: string; firstName: string; lastName: string; department?: { name: string } | null; }
interface DepartmentOption { id: string; name: string; }

export default function BookAppointmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointmentCode, setAppointmentCode] = useState("");
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch("/api/public/staff").then((r) => r.json()).then(setStaff).catch(() => toast.error("Failed to load staff list"));
    fetch("/api/public/departments").then((r) => r.json()).then(setDepartments).catch(() => toast.error("Failed to load departments"));
  }, []);

  async function onSubmit(values: Record<string, string>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to book appointment"); return; }
      setAppointmentCode(data.appointmentCode);
      setSuccess(true);
      toast.success("Appointment booked successfully!");
    } catch { toast.error("Something went wrong"); } finally { setIsLoading(false); }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F9FB", padding: 16, fontFamily: "Inter, sans-serif" }}>
        <Card style={{ maxWidth: 480, width: "100%", borderRadius: 16, border: "1px solid #E5E7EB" }}>
          <Result
            icon={<CheckCircleOutlined style={{ color: "#00C48C" }} />}
            title="Appointment Booked!"
            subTitle="Your appointment has been submitted for approval"
            extra={[
              <div key="code" style={{ background: "#F1F5F9", borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <Text type="secondary">Your reference code</Text>
                <div><Text strong style={{ fontSize: 28, fontFamily: "monospace", color: "#0A2540" }}>{appointmentCode}</Text></div>
              </div>,
              <Text key="note" type="secondary" style={{ display: "block", marginBottom: 16 }}>Please save this code. You&apos;ll need it when you arrive.</Text>,
              <div key="actions" style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <Link href={`/appointment-status?code=${appointmentCode}`}><Button type="primary" style={{ borderRadius: 10, background: "#0A2540", borderColor: "#0A2540" }}>Check Status</Button></Link>
                <Button onClick={() => { setSuccess(false); form.resetFields(); }} style={{ borderRadius: 10 }}>Book Another</Button>
              </div>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F9FB", padding: "32px 16px", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header style={{ maxWidth: 720, margin: "0 auto 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ height: 40, width: 40, borderRadius: 10, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#00C48C", fontWeight: "bold" }}>VF</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#0A2540" }}>VisitFlow</span>
        </Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12, color: "#43474D" }}>
          <span>Enterprise Security Ready</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#74777E", display: "inline-block" }} />
          <span>ISO 27001 Certified</span>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0A2540", margin: 0 }}>Book an Appointment</h1>
          <p style={{ fontSize: 14, color: "#43474D", marginTop: 4 }}>Please provide the necessary details for your upcoming visit.</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="firstName" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>First Name *</span>} rules={[{ required: true }]}><Input style={{ borderRadius: 10 }} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="lastName" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Last Name *</span>} rules={[{ required: true }]}><Input style={{ borderRadius: 10 }} /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="email" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Email</span>}><Input type="email" style={{ borderRadius: 10 }} /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="phone" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Phone Number *</span>} rules={[{ required: true }]}><Input style={{ borderRadius: 10 }} /></Form.Item></Col>
            </Row>
            <Form.Item name="company" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Company / Organization</span>}><Input style={{ borderRadius: 10 }} /></Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="departmentId" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Department</span>}>
                  <Select placeholder="Select department" allowClear options={departments.map((d) => ({ label: d.name, value: d.id }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="recipientId" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Who do you want to see? *</span>} rules={[{ required: true }]}>
                  <Select placeholder="Select person" showSearch optionFilterProp="label"
                    options={staff.map((s) => ({ label: `${s.firstName} ${s.lastName}${s.department ? ` (${s.department.name})` : ""}`, value: s.id }))} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="purpose" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Purpose of Visit *</span>} rules={[{ required: true }]}>
              <Input.TextArea rows={3} style={{ borderRadius: 10 }} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={8}><Form.Item name="date" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Preferred Date *</span>} rules={[{ required: true }]}><Input type="date" min={new Date().toISOString().split("T")[0]} style={{ borderRadius: 10 }} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="startTime" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Start Time *</span>} rules={[{ required: true }]}><Input type="time" style={{ borderRadius: 10 }} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="endTime" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>End Time *</span>} rules={[{ required: true }]}><Input type="time" style={{ borderRadius: 10 }} /></Form.Item></Col>
            </Row>
            <Form.Item name="notes" label={<span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>Additional Notes</span>}><Input.TextArea rows={2} style={{ borderRadius: 10 }} /></Form.Item>
            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", padding: "14px 24px", background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, transition: "all 0.2s" }}
            >
              {isLoading ? "Booking..." : "Book Appointment"}
            </button>
          </Form>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#43474D" }}>
          Already have a reference code?{" "}
          <Link href="/appointment-status" style={{ fontWeight: 600, color: "#006C4B", textDecoration: "none" }}>Check your status</Link>
        </p>
      </div>
    </div>
  );
}
