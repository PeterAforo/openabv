"use client";

import React, { useState, useEffect } from "react";
import { Avatar, Button, Card, Spin, Typography, Space, Tag } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, BankOutlined, CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useParams } from "next/navigation";

const { Title, Text } = Typography;

interface StaffCard {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    image: string | null;
    department: string | null;
    branch: string | null;
    title: string | null;
    office: string | null;
    extension: string | null;
  };
  qrCode: string;
  url: string;
}

export default function StaffCardPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [data, setData] = useState<StaffCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/staff/${userId}/qrcode?type=card`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size="large" /></div>;
  if (!data?.user) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Text>Staff member not found.</Text></div>;

  const { user, qrCode } = data;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Inter, sans-serif" }}>
      <Card style={{ maxWidth: 420, width: "100%", borderRadius: 20, border: "none", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        {/* Header gradient strip */}
        <div style={{ background: "linear-gradient(135deg, #0A2540, #1a3a5c)", height: 80, margin: "-24px -24px 0 -24px" }} />

        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: -44 }}>
          <Avatar
            src={user.image || undefined}
            icon={!user.image ? <UserOutlined /> : undefined}
            size={88}
            style={{ border: "4px solid #fff", background: user.image ? undefined : "#00C48C", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
          />
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Title level={3} style={{ margin: 0, color: "#0A2540" }}>{user.firstName} {user.lastName}</Title>
          {user.title && <Text style={{ display: "block", fontSize: 14, color: "#43474D" }}>{user.title}</Text>}
          {user.department && <Tag color="blue" style={{ marginTop: 8 }}><BankOutlined /> {user.department}</Tag>}
          {user.branch && <Tag style={{ marginTop: 8 }}><EnvironmentOutlined /> {user.branch}</Tag>}
        </div>

        {/* Contact Details */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10, padding: "0 8px" }}>
          {user.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 10 }}>
              <MailOutlined style={{ color: "#0A2540" }} />
              <a href={`mailto:${user.email}`} style={{ color: "#0A2540", textDecoration: "none" }}>{user.email}</a>
            </div>
          )}
          {user.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 10 }}>
              <PhoneOutlined style={{ color: "#0A2540" }} />
              <a href={`tel:${user.phone}`} style={{ color: "#0A2540", textDecoration: "none" }}>{user.phone}</a>
            </div>
          )}
          {user.office && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 10 }}>
              <EnvironmentOutlined style={{ color: "#0A2540" }} />
              <Text>Office: {user.office}{user.extension ? ` · Ext. ${user.extension}` : ""}</Text>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div style={{ textAlign: "center", marginTop: 24, padding: 16, background: "#F8FAFC", borderRadius: 12 }}>
          <img src={qrCode} alt="QR Code" style={{ width: 160, height: 160 }} />
          <div style={{ marginTop: 8 }}><Text type="secondary" style={{ fontSize: 11 }}>Scan to view this card</Text></div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          <Link href={`/book-appointment?staffId=${user.id}`} style={{ flex: 1 }}>
            <Button type="primary" block icon={<CalendarOutlined />} style={{ borderRadius: 10, background: "#0A2540", borderColor: "#0A2540", height: 42 }}>
              Book Appointment
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
            <div style={{ height: 24, width: 24, borderRadius: 6, background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#00C48C", fontWeight: "bold", fontSize: 10 }}>VF</span>
            </div>
            <span style={{ fontSize: 12, color: "#74777E" }}>Powered by VisitFlow</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
