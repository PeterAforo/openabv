"use client";

import React, { useState } from "react";
import { Button, Card, Input, List, Space, Tag, Typography } from "antd";
import { LoginOutlined, QrcodeOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

const statusTagColor: Record<string, string> = {
  PENDING: "warning", APPROVED: "success", CHECKED_IN: "green", DECLINED: "error", COMPLETED: "default",
};

interface SearchResult {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  visitor: { id: string; firstName: string; lastName: string; phone: string; company?: string };
  recipient: { firstName: string; lastName: string };
}

export default function SecurityCheckPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  async function onSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/visitors/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Search failed"); return; }
      setResults(data);
      if (data.length === 0) toast.info("No appointments found for today");
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCheckIn(appointment: SearchResult) {
    setIsCheckingIn(true);
    try {
      const res = await fetch("/api/visitors/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          visitorId: appointment.visitor.id,
          purpose: appointment.purpose,
          recipientName: `${appointment.recipient.firstName} ${appointment.recipient.lastName}`,
        }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error || "Check-in failed"); return; }
      toast.success(`${appointment.visitor.firstName} ${appointment.visitor.lastName} checked in successfully`);
      setResults((prev) => prev.map((r) => (r.id === appointment.id ? { ...r, status: "CHECKED_IN" } : r)));
    } catch {
      toast.error("Check-in failed");
    } finally {
      setIsCheckingIn(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Check Appointment</Title>
        <Text type="secondary">Search by name, phone, reference code, or QR code</Text>
      </div>

      <Card title={<><SearchOutlined /> Search Visitor</>} extra={<Text type="secondary">Enter a reference code, name, or phone number</Text>}>
        <Space.Compact style={{ width: "100%" }}>
          <Input placeholder="Reference code, name, or phone..." value={query} onChange={(e) => setQuery(e.target.value)} onPressEnter={onSearch} style={{ flex: 1 }} />
          <Button type="primary" onClick={onSearch} loading={isSearching}>Search</Button>
          <Button icon={<QrcodeOutlined />} title="Scan QR Code" />
        </Space.Compact>
      </Card>

      {results.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Results ({results.length})</Title>
          <List
            dataSource={results}
            renderItem={(result) => (
              <List.Item
                key={result.id}
                style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }}
                actions={[
                  result.status === "APPROVED" ? (
                    <Button key="checkin" type="primary" icon={<LoginOutlined />} onClick={() => handleCheckIn(result)} disabled={isCheckingIn}>Check In</Button>
                  ) : result.status === "CHECKED_IN" ? (
                    <Tag key="status" color="green">Already Checked In</Tag>
                  ) : result.status === "PENDING" ? (
                    <Tag key="status" color="warning">Pending Approval</Tag>
                  ) : (
                    <Tag key="status" color={statusTagColor[result.status] || "default"}>{result.status}</Tag>
                  ),
                ]}
              >
                <List.Item.Meta
                  title={<><Text strong>{result.visitor.firstName} {result.visitor.lastName}</Text> <Tag color={statusTagColor[result.status] || "default"}>{result.status}</Tag></>}
                  description={<>
                    <Text type="secondary">Code: </Text><Text code>{result.appointmentCode}</Text><br />
                    <Text type="secondary">Meeting: {result.recipient.firstName} {result.recipient.lastName}</Text><br />
                    <Text type="secondary">Time: {new Date(result.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(result.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text><br />
                    <Text type="secondary">Purpose: {result.purpose}</Text>
                    {result.visitor.company && <><br /><Text type="secondary">Company: {result.visitor.company}</Text></>}
                  </>}
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
}
