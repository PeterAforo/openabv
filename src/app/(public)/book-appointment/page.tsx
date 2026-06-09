"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Col, Form, Input, Result, Row, Select, Typography, Steps } from "antd";
import { CheckCircleOutlined, PhoneOutlined, SafetyOutlined, FormOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import Link from "next/link";
import { PhotoCapture } from "@/components/ui/photo-capture";

const { Text } = Typography;

interface StaffOption { id: string; firstName: string; lastName: string; department?: { name: string } | null; }
interface DepartmentOption { id: string; name: string; }

const LABEL = (text: string) => <span style={{ fontSize: 12, fontWeight: 500, color: "#0A2540" }}>{text}</span>;

export default function BookAppointmentPage() {
  const [step, setStep] = useState<"verify" | "form" | "success">("verify");
  const [isLoading, setIsLoading] = useState(false);
  const [appointmentCode, setAppointmentCode] = useState("");
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [form] = Form.useForm();
  const [verifyForm] = Form.useForm();

  useEffect(() => {
    if (step === "form") {
      fetch("/api/public/staff").then((r) => r.json()).then(setStaff).catch(() => toast.error("Failed to load staff list"));
      fetch("/api/public/departments").then((r) => r.json()).then(setDepartments).catch(() => toast.error("Failed to load departments"));
    }
  }, [step]);

  async function requestCode() {
    const phone = verifyForm.getFieldValue("phone");
    const email = verifyForm.getFieldValue("email");
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/public/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email, action: "request" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to send code"); return; }
      setCodeSent(true);
      toast.success(data.message || "Verification code sent to your email");
      // In dev mode, show the code
      if (data._devCode) {
        toast.info(`Dev code: ${data._devCode}`, { duration: 30000 });
      }
    } catch { toast.error("Something went wrong"); } finally { setIsLoading(false); }
  }

  async function verifyCode(values: { phone: string; code: string }) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/public/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: values.phone, code: values.code, action: "verify" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Verification failed"); return; }
      setVerifiedPhone(data.phone);
      setVerifyToken(data.token);
      setStep("form");
      form.setFieldValue("phone", data.phone);
      toast.success("Phone verified! You can now book your appointment.");
    } catch { toast.error("Something went wrong"); } finally { setIsLoading(false); }
  }

  async function onSubmit(values: Record<string, string>) {
    setIsLoading(true);
    try {
      const payload = { ...values, phone: verifiedPhone, verifyToken };
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to book appointment"); return; }
      setAppointmentCode(data.appointmentCode);
      setStep("success");
      toast.success("Appointment booked successfully!");
    } catch { toast.error("Something went wrong"); } finally { setIsLoading(false); }
  }

  const header = (
    <header style={{ maxWidth: 720, margin: "0 auto 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{ height: 40, width: 40, borderRadius: 10, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#00C48C", fontWeight: "bold" }}>VF</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#0A2540" }}>VisitFlow</span>
      </Link>
      <div className="vf-booking-header-badges" style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 12, color: "#43474D" }}>
        <span>Enterprise Security Ready</span>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#74777E", display: "inline-block" }} />
        <span>ISO 27001 Certified</span>
      </div>
    </header>
  );

  if (step === "success") {
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
                <Button onClick={() => { setStep("verify"); setCodeSent(false); verifyForm.resetFields(); form.resetFields(); }} style={{ borderRadius: 10 }}>Book Another</Button>
              </div>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F9FB", padding: "32px 16px", fontFamily: "Inter, sans-serif" }}>
      {header}

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0A2540", margin: 0 }}>Book an Appointment</h1>
          <p style={{ fontSize: 14, color: "#43474D", marginTop: 4 }}>Verify your phone number to access the booking form.</p>
        </div>

        <Steps
          current={step === "verify" ? 0 : 1}
          style={{ marginBottom: 32 }}
          items={[
            { title: "Verify Identity", icon: <SafetyOutlined /> },
            { title: "Appointment Details", icon: <FormOutlined /> },
          ]}
        />

        {step === "verify" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0A2540", margin: 0 }}>Verify Your Identity</h2>
              <p style={{ fontSize: 13, color: "#43474D", marginTop: 4 }}>For security purposes, we need to verify your identity before showing company information. Enter your phone number and email to receive a verification code.</p>
            </div>
            <Form form={verifyForm} layout="vertical" onFinish={verifyCode} requiredMark={false}>
              <Form.Item name="phone" label={LABEL("Phone Number *")} rules={[{ required: true, message: "Phone number is required" }]}>
                <Input
                  prefix={<PhoneOutlined style={{ color: "#999" }} />}
                  placeholder="+233 240 000 000"
                  style={{ borderRadius: 10 }}
                  disabled={codeSent}
                />
              </Form.Item>
              <Form.Item name="email" label={LABEL("Email Address (for receiving OTP code) *")} rules={[{ required: true, type: "email", message: "Valid email is required to receive OTP" }]}>
                <Input
                  placeholder="your@email.com"
                  style={{ borderRadius: 10 }}
                  disabled={codeSent}
                />
              </Form.Item>
              {!codeSent && (
                <Button
                  type="primary"
                  block
                  size="large"
                  loading={isLoading}
                  onClick={requestCode}
                  style={{ borderRadius: 10, background: "#0A2540", borderColor: "#0A2540", height: 48 }}
                >
                  Send Verification Code
                </Button>
              )}
              {codeSent && (
                <>
                  <Form.Item name="code" label={LABEL("Verification Code *")} rules={[{ required: true, message: "Enter the 6-digit code" }]}>
                    <Input
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      style={{ borderRadius: 10, fontSize: 20, letterSpacing: 8, textAlign: "center" }}
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={isLoading}
                    style={{ borderRadius: 10, background: "#00C48C", borderColor: "#00C48C", height: 48 }}
                  >
                    Verify & Continue
                  </Button>
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <Button type="link" onClick={() => { setCodeSent(false); }} style={{ color: "#43474D" }}>Resend code</Button>
                  </div>
                </>
              )}
            </Form>
          </div>
        )}

        {step === "form" && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 16, padding: "8px 12px", background: "#E6F9F1", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircleOutlined style={{ color: "#00C48C" }} />
              <Text style={{ fontSize: 13, color: "#0A2540" }}>Verified: {verifiedPhone}</Text>
            </div>
            <Form form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item name="firstName" label={LABEL("First Name *")} rules={[{ required: true }]}><Input style={{ borderRadius: 10 }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="lastName" label={LABEL("Last Name *")} rules={[{ required: true }]}><Input style={{ borderRadius: 10 }} /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}><Form.Item name="email" label={LABEL("Email")}><Input type="email" style={{ borderRadius: 10 }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="phone" label={LABEL("Phone Number")}><Input style={{ borderRadius: 10 }} disabled /></Form.Item></Col>
              </Row>
              <Form.Item name="company" label={LABEL("Company / Organization")}><Input style={{ borderRadius: 10 }} /></Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="departmentId" label={LABEL("Department")}>
                    <Select placeholder="Select department" allowClear options={departments.map((d) => ({ label: d.name, value: d.id }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="recipientId" label={LABEL("Who do you want to see? *")} rules={[{ required: true }]}>
                    <Select placeholder="Select person" showSearch optionFilterProp="label"
                      options={staff.map((s) => ({ label: `${s.firstName} ${s.lastName}${s.department ? ` (${s.department.name})` : ""}`, value: s.id }))} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="purpose" label={LABEL("Purpose of Visit *")} rules={[{ required: true }]}>
                <Input.TextArea rows={3} style={{ borderRadius: 10 }} />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={8}><Form.Item name="date" label={LABEL("Preferred Date *")} rules={[{ required: true }]}><Input type="date" min={new Date().toISOString().split("T")[0]} style={{ borderRadius: 10 }} /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="startTime" label={LABEL("Start Time *")} rules={[{ required: true }]}><Input type="time" style={{ borderRadius: 10 }} /></Form.Item></Col>
                <Col xs={24} md={8}><Form.Item name="endTime" label={LABEL("End Time *")} rules={[{ required: true }]}><Input type="time" style={{ borderRadius: 10 }} /></Form.Item></Col>
              </Row>
              <Form.Item name="photo" label={LABEL("Your Photo (optional)")}>
                <PhotoCapture size={80} />
              </Form.Item>
              <Form.Item name="notes" label={LABEL("Additional Notes")}><Input.TextArea rows={2} style={{ borderRadius: 10 }} /></Form.Item>
              <button
                type="submit"
                disabled={isLoading}
                style={{ width: "100%", padding: "14px 24px", background: "#0A2540", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, transition: "all 0.2s" }}
              >
                {isLoading ? "Booking..." : "Book Appointment"}
              </button>
            </Form>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#43474D" }}>
          Already have a reference code?{" "}
          <Link href="/appointment-status" style={{ fontWeight: 600, color: "#006C4B", textDecoration: "none" }}>Check your status</Link>
        </p>
      </div>
    </div>
  );
}
