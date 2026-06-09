"use client";

import React, { Suspense, useState } from "react";
import { Card, Descriptions, Input, Tag, Typography, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

const statusTagColor: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  DECLINED: "error",
  RESCHEDULED: "processing",
  CANCELLED: "default",
  CHECKED_IN: "cyan",
  CHECKED_OUT: "geekblue",
  NO_SHOW: "volcano",
  COMPLETED: "purple",
};

interface AppointmentResult {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string };
  recipient: { firstName: string; lastName: string };
}

function AppointmentStatusContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentResult | null>(null);

  async function onSearch() {
    if (!code.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/appointments/status?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Appointment not found");
        setAppointment(null);
        return;
      }
      setAppointment(data);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "48px 16px" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", color: "#00C48C", fontWeight: 700 }}>VF</div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>VisitFlow</span>
          </Link>
          <Title level={2} style={{ margin: "8px 0 0" }}>Check Appointment Status</Title>
          <Text type="secondary">Enter your reference code to check status</Text>
        </div>

        <Card title="Appointment Lookup" style={{ marginBottom: 16 }}>
          <Input.Search
            size="large"
            placeholder="APT-XXXXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onSearch={onSearch}
            enterButton={<><SearchOutlined /> Check Status</>}
            loading={isLoading}
          />
        </Card>

        {appointment && (
          <Card title="Appointment Details" extra={<Tag color={statusTagColor[appointment.status] || "default"}>{appointment.status}</Tag>}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Reference"><Text code>{appointment.appointmentCode}</Text></Descriptions.Item>
              <Descriptions.Item label="Date">{new Date(appointment.date).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Time">
                {new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" - "}
                {new Date(appointment.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Descriptions.Item>
              <Descriptions.Item label="Meeting With">{appointment.recipient.firstName} {appointment.recipient.lastName}</Descriptions.Item>
              <Descriptions.Item label="Purpose" span={2}>{appointment.purpose}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <p style={{ textAlign: "center", marginTop: 24, color: "#8c8c8c", fontSize: 14 }}>
          Need to book an appointment?{" "}
          <Link href="/book-appointment" style={{ color: "#0A2540" }}>Book here</Link>
        </p>
      </div>
    </div>
  );
}

export default function AppointmentStatusPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>}>
      <AppointmentStatusContent />
    </Suspense>
  );
}
