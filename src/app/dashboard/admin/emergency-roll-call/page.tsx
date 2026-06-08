"use client";

import { useState, useEffect } from "react";
import { Button, Card, Col, Input, Row, Statistic, Table, Tag, Typography, Avatar } from "antd";
import { DownloadOutlined, SearchOutlined, CheckCircleOutlined, WarningOutlined, TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface VisitorEntry {
  id: string;
  checkInTime: string;
  purpose: string;
  recipientName?: string;
  isAccountedFor: boolean;
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

const { Title, Text } = Typography;

export default function EmergencyRollCallPage() {
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [summary, setSummary] = useState({ total: 0, accounted: 0, unaccounted: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchVisitors(); }, []);

  async function fetchVisitors() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/emergency");
      if (res.ok) {
        const data = await res.json();
        setVisitors(data.visitors);
        setSummary(data.summary);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  async function markAccounted(visitorLogId: string, accounted: boolean) {
    try {
      await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorLogId, isAccountedFor: accounted }),
      });
      fetchVisitors();
    } catch { /* ignore */ }
  }

  function exportCSV() {
    const headers = "Name,Phone,Company,Host,Check-In,Accounted\n";
    const rows = visitors.map(v =>
      `"${v.visitor.firstName} ${v.visitor.lastName}","${v.visitor.phone}","${v.visitor.company || ""}","${v.recipientName || ""}","${new Date(v.checkInTime).toLocaleString()}","${v.isAccountedFor ? "Yes" : "No"}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emergency-roll-call-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const columns: ColumnsType<VisitorEntry> = [
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
            <Tag style={{ marginLeft: 8 }} color="blue">{entry.visitor.visitorType}</Tag>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{entry.visitor.phone}</Text>
          </div>
        </div>
      ),
    },
    { title: "Host", dataIndex: "recipientName", key: "host", render: (v: string) => v || "N/A" },
    {
      title: "Check-In",
      dataIndex: "checkInTime",
      key: "checkInTime",
      render: (t: string) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    {
      title: "Status",
      key: "status",
      render: (_, entry) => entry.isAccountedFor
        ? <Tag color="success" icon={<CheckCircleOutlined />}>Accounted</Tag>
        : <Tag color="error" icon={<WarningOutlined />}>Unaccounted</Tag>,
      filters: [
        { text: "Accounted", value: true },
        { text: "Unaccounted", value: false },
      ],
      onFilter: (value, record) => record.isAccountedFor === value,
    },
    {
      title: "Action",
      key: "action",
      render: (_, entry) => (
        <Button
          type={entry.isAccountedFor ? "default" : "primary"}
          size="small"
          style={entry.isAccountedFor ? {} : { background: "#52c41a", borderColor: "#52c41a" }}
          onClick={() => markAccounted(entry.id, !entry.isAccountedFor)}
        >
          {entry.isAccountedFor ? "Undo" : "Mark Safe"}
        </Button>
      ),
    },
  ];

  const filteredData = visitors.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${v.visitor.firstName} ${v.visitor.lastName}`.toLowerCase().includes(q) ||
      v.visitor.phone.includes(q) ||
      (v.visitor.company || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><WarningOutlined style={{ color: "#ff4d4f" }} /> Emergency Roll Call</Title>
          <Text type="secondary">All visitors currently inside the building</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={exportCSV}>Export CSV</Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card size="small"><Statistic title="Total Inside" value={summary.total} prefix={<TeamOutlined />} valueStyle={{ color: "#1677ff" }} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small"><Statistic title="Accounted For" value={summary.accounted} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#52c41a" }} /></Card>
        </Col>
        <Col xs={8}>
          <Card size="small"><Statistic title="Unaccounted" value={summary.unaccounted} prefix={<WarningOutlined />} valueStyle={{ color: "#ff4d4f" }} /></Card>
        </Col>
      </Row>

      <Card title={`Visitors (${filteredData.length})`} extra={
        <Input prefix={<SearchOutlined />} placeholder="Search visitors..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} allowClear />
      }>
        <Table<VisitorEntry>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
