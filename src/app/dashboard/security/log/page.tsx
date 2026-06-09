"use client";

import React, { useState, useEffect } from "react";
import { Empty, Input, Spin, Table, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface LogEntry {
  id: string;
  purpose: string;
  recipientName: string | null;
  status: string;
  checkInTime: string;
  checkOutTime: string | null;
  isWalkIn: boolean;
  badgeNumber: string | null;
  visitor: { firstName: string; lastName: string; phone: string; company: string | null };
}

export default function SecurityLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/visitors/current?all=true");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setLogs(data.visitors || []);
      } catch {
        toast.error("Failed to load visitor log");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) =>
    `${l.visitor.firstName} ${l.visitor.lastName} ${l.visitor.phone}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnsType<LogEntry> = [
    {
      title: "Visitor", key: "visitor",
      render: (_, log) => (
        <div>
          <Text strong>{log.visitor.firstName} {log.visitor.lastName}</Text>
          <br /><Text type="secondary" style={{ fontSize: 12 }}>{log.visitor.phone}</Text>
        </div>
      ),
    },
    {
      title: "Status", key: "status",
      render: (_, log) => (
        <>
          <Tag color={log.status === "CHECKED_IN" ? "green" : "default"}>{log.status === "CHECKED_IN" ? "Inside" : "Checked Out"}</Tag>
          {log.isWalkIn && <Tag color="orange">Walk-In</Tag>}
        </>
      ),
    },
    { title: "Purpose", dataIndex: "purpose", key: "purpose", ellipsis: true },
    { title: "Visiting", dataIndex: "recipientName", key: "host", render: (v: string | null) => v || "-" },
    { title: "Check-In", dataIndex: "checkInTime", key: "in", render: (v: string) => new Date(v).toLocaleString() },
    { title: "Check-Out", dataIndex: "checkOutTime", key: "out", render: (v: string | null) => v ? new Date(v).toLocaleString() : "-" },
    { title: "Badge", dataIndex: "badgeNumber", key: "badge", render: (v: string | null) => v || "-" },
  ];

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Visitor Log</Title>
        <Text type="secondary">Complete visitor check-in/out history</Text>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="Search visitors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear style={{ maxWidth: 300 }} />
      </div>

      <Table<LogEntry> columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 20, showSizeChanger: true }} scroll={{ x: 600 }} locale={{ emptyText: <Empty description="No visitor logs found" /> }} />
    </div>
  );
}
