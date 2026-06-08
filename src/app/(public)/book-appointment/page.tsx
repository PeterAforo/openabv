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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", padding: 16 }}>
        <Card style={{ maxWidth: 450, width: "100%" }}>
          <Result
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            title="Appointment Booked!"
            subTitle="Your appointment has been submitted for approval"
            extra={[
              <div key="code" style={{ background: "#f5f5f5", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <Text type="secondary">Your reference code</Text>
                <div><Text strong style={{ fontSize: 24, fontFamily: "monospace" }}>{appointmentCode}</Text></div>
              </div>,
              <Text key="note" type="secondary" style={{ display: "block", marginBottom: 16 }}>Please save this code. You&apos;ll need it when you arrive.</Text>,
              <div key="actions" style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Link href={`/appointment-status?code=${appointmentCode}`}><Button type="primary">Check Status</Button></Link>
                <Button onClick={() => { setSuccess(false); form.resetFields(); }}>Book Another</Button>
              </div>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "32px 16px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ height: 40, width: 40, borderRadius: 12, background: "#1677ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: "bold" }}>OA</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: "bold" }}>OpenABV</span>
          </Link>
          <Title level={2}>Book an Appointment</Title>
          <Text type="secondary">Fill in the form below to schedule your visit</Text>
        </div>

        <Card title="Appointment Details" extra={<Text type="secondary">Fields marked with * are required</Text>}>
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="email" label="Email"><Input type="email" /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="phone" label="Phone Number" rules={[{ required: true }]}><Input /></Form.Item></Col>
            </Row>
            <Form.Item name="company" label="Company / Organization"><Input /></Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="departmentId" label="Department">
                  <Select placeholder="Select department" allowClear options={departments.map((d) => ({ label: d.name, value: d.id }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="recipientId" label="Who do you want to see?" rules={[{ required: true }]}>
                  <Select placeholder="Select person" showSearch optionFilterProp="label"
                    options={staff.map((s) => ({ label: `${s.firstName} ${s.lastName}${s.department ? ` (${s.department.name})` : ""}`, value: s.id }))} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="purpose" label="Purpose of Visit" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Row gutter={16}>
              <Col xs={24} md={8}><Form.Item name="date" label="Preferred Date" rules={[{ required: true }]}><Input type="date" min={new Date().toISOString().split("T")[0]} /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}><Input type="time" /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="endTime" label="End Time" rules={[{ required: true }]}><Input type="time" /></Form.Item></Col>
            </Row>
            <Form.Item name="notes" label="Additional Notes"><Input.TextArea rows={2} /></Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={isLoading}>
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </Form>
        </Card>

        <p style={{ textAlign: "center", marginTop: 24 }}>
          <Text type="secondary">Already have a reference code? </Text>
          <Link href="/appointment-status" style={{ fontWeight: 500 }}>Check your status</Link>
        </p>
      </div>
    </div>
  );
}
