"use client";

import React, { useState, useEffect } from "react";
import { Empty, Input, Spin, Table, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface HistoryEntry {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string; phone: string };
}

export default function StaffHistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/appointments?status=COMPLETED");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setHistory(data.appointments || []);
      } catch {
        toast.error("Failed to load history");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = history.filter((h) =>
    `${h.visitor.firstName} ${h.visitor.lastName} ${h.appointmentCode}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnsType<HistoryEntry> = [
    {
      title: "Visitor", key: "visitor",
      render: (_, e) => <><Text strong>{e.visitor.firstName} {e.visitor.lastName}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{e.visitor.phone}</Text></>,
    },
    { title: "Code", dataIndex: "appointmentCode", key: "code", render: (v: string) => <Text code>{v}</Text> },
    { title: "Purpose", dataIndex: "purpose", key: "purpose", ellipsis: true },
    { title: "Status", dataIndex: "status", key: "status", render: (v: string) => <Tag color="default">{v}</Tag> },
    { title: "Date", dataIndex: "date", key: "date", render: (v: string) => new Date(v).toLocaleDateString(), sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() },
  ];

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Visitor History</Title>
        <Text type="secondary">Past completed appointments</Text>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear style={{ maxWidth: 300 }} />
      </div>

      <Table<HistoryEntry> columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 20, showSizeChanger: true }} scroll={{ x: 600 }} locale={{ emptyText: <Empty description="No history found" /> }} />
    </div>
  );
}
