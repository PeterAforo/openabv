"use client";

import React, { useState } from "react";
import { Button, Card, Input, List, Space, Tag, Typography } from "antd";
import { LoginOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface AppointmentResult {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  purpose: string;
  visitor: { id: string; firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
}

export default function ReceptionistCheckinPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AppointmentResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [badgeNumber, setBadgeNumber] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/visitors/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.appointments || []);
      if ((data.appointments || []).length === 0) toast.info("No appointments found");
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCheckin(appointment: AppointmentResult) {
    try {
      const res = await fetch("/api/visitors/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          visitorId: appointment.visitor.id,
          purpose: appointment.purpose,
          recipientName: `${appointment.recipient.firstName} ${appointment.recipient.lastName}`,
          badgeNumber: badgeNumber || undefined,
        }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Check-in failed"); return; }
      toast.success(`${appointment.visitor.firstName} ${appointment.visitor.lastName} checked in`);
      setResults((prev) => prev.filter((r) => r.id !== appointment.id));
      setBadgeNumber("");
    } catch {
      toast.error("Check-in failed");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Check-In</Title>
        <Text type="secondary">Search for appointments and check in visitors</Text>
      </div>

      <Card>
        <Space.Compact style={{ width: "100%" }}>
          <Input placeholder="Search by name, phone, or appointment code..." value={query} onChange={(e) => setQuery(e.target.value)} onPressEnter={handleSearch} style={{ flex: 1 }} />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={isSearching}>{isSearching ? "Searching..." : "Search"}</Button>
        </Space.Compact>
      </Card>

      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, maxWidth: 300 }}>
            <Text strong style={{ whiteSpace: "nowrap" }}>Badge #</Text>
            <Input value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} placeholder="Optional" />
          </div>
          <List
            dataSource={results}
            renderItem={(apt) => (
              <List.Item key={apt.id} style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }}
                actions={[<Button key="checkin" type="primary" icon={<LoginOutlined />} onClick={() => handleCheckin(apt)}>Check In</Button>]}
              >
                <List.Item.Meta
                  title={<><Text strong>{apt.visitor.firstName} {apt.visitor.lastName}</Text> <Tag>{apt.status}</Tag></>}
                  description={<><Text code>{apt.appointmentCode}</Text><br /><Text type="secondary">With: {apt.recipient.firstName} {apt.recipient.lastName} | {apt.purpose}</Text></>}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
}
