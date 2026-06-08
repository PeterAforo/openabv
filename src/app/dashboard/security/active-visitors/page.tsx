"use client";

import { useState, useEffect } from "react";
import { Button, Card, Input, Table, Tag, Typography, Avatar, Space, Modal } from "antd";
import { LogoutOutlined, PrinterOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { VisitorBadge } from "@/components/visitor-badge";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface ActiveVisitor {
  id: string;
  checkInTime: string;
  purpose: string;
  recipientName?: string;
  badgeNumber?: string;
  photoUrl?: string;
  visitor: {
    firstName: string;
    lastName: string;
    phone: string;
    company?: string;
    photo?: string;
    visitorType: string;
  };
  branch?: { name: string };
}

export default function ActiveVisitorsPage() {
  const [visitors, setVisitors] = useState<ActiveVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [badgeLogId, setBadgeLogId] = useState<string | null>(null);

  useEffect(() => { fetchVisitors(); }, []);

  async function fetchVisitors() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/emergency");
      if (res.ok) {
        const data = await res.json();
        setVisitors(data.visitors);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function handleCheckout(logId: string) {
    try {
      await fetch("/api/visitors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorLogId: logId }),
      });
      fetchVisitors();
    } catch { /* ignore */ }
  }

  const filtered = visitors.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${v.visitor.firstName} ${v.visitor.lastName}`.toLowerCase().includes(q) ||
      v.visitor.phone.includes(q) ||
      (v.recipientName || "").toLowerCase().includes(q);
  });

  const columns: ColumnsType<ActiveVisitor> = [
    {
      title: "Visitor",
      key: "visitor",
      render: (_, entry) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar src={entry.visitor.photo || entry.photoUrl} size={40}>
            {entry.visitor.firstName[0]}{entry.visitor.lastName[0]}
          </Avatar>
          <div>
            <Text strong>{entry.visitor.firstName} {entry.visitor.lastName}</Text>
            <Tag color="blue" style={{ marginLeft: 6 }}>{entry.visitor.visitorType}</Tag>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{entry.visitor.phone}{entry.visitor.company && ` · ${entry.visitor.company}`}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Host",
      dataIndex: "recipientName",
      key: "host",
      render: (v: string) => v || "N/A",
    },
    {
      title: "Check-In",
      dataIndex: "checkInTime",
      key: "checkIn",
      render: (t: string) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    {
      title: "Badge",
      dataIndex: "badgeNumber",
      key: "badge",
      render: (v: string) => v ? <Tag>{v}</Tag> : "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, entry) => (
        <Space>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => setBadgeLogId(entry.id)} title="Print Badge" />
          <Button size="small" danger icon={<LogoutOutlined />} onClick={() => handleCheckout(entry.id)} title="Check Out" />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><TeamOutlined /> Active Visitors</Title>
          <Text type="secondary">{visitors.length} visitors currently inside</Text>
        </div>
      </div>

      <Card title="Current Visitors" extra={
        <Input prefix={<SearchOutlined />} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} allowClear />
      }>
        <Table<ActiveVisitor>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
        />
      </Card>

      <Modal title="Visitor Badge" open={!!badgeLogId} onCancel={() => setBadgeLogId(null)} footer={null} destroyOnClose>
        {badgeLogId && <VisitorBadge visitorLogId={badgeLogId} />}
      </Modal>
    </div>
  );
}
