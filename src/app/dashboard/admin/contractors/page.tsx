"use client";

import { useState, useEffect } from "react";
import { Card, Col, Input, Row, Statistic, Table, Tag, Typography, Avatar } from "antd";
import { ToolOutlined, SearchOutlined, SafetyCertificateOutlined, WarningOutlined, TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface ContractorVisitor {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  visitorType: string;
  photo?: string;
  accessExpiry?: string;
  safetyInduction: boolean;
  idVerified: boolean;
  createdAt: string;
  documents: { id: string; type: string; fileName: string; expiresAt?: string }[];
  _count: { appointments: number; visitorLogs: number };
}

export default function ContractorsPage() {
  const [visitors, setVisitors] = useState<ContractorVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchContractors(); }, []);

  async function fetchContractors() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/visitors?types=CONTRACTOR,VENDOR,DELIVERY");
      if (res.ok) setVisitors(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  const filtered = visitors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${v.firstName} ${v.lastName}`.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      (v.company || "").toLowerCase().includes(q);
  });

  const typeColor: Record<string, string> = { CONTRACTOR: "orange", VENDOR: "purple", DELIVERY: "cyan" };

  const columns: ColumnsType<ContractorVisitor> = [
    {
      title: "Contractor / Vendor",
      key: "name",
      render: (_, v) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar src={v.photo} size={36}>{v.firstName[0]}{v.lastName[0]}</Avatar>
          <div>
            <Text strong>{v.firstName} {v.lastName}</Text>
            <Tag color={typeColor[v.visitorType] || "default"} style={{ marginLeft: 8 }}>{v.visitorType}</Tag>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{v.company || "—"} · {v.phone}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Safety Induction",
      key: "safety",
      render: (_, v) => v.safetyInduction
        ? <Tag color="success" icon={<SafetyCertificateOutlined />}>Completed</Tag>
        : <Tag color="warning" icon={<WarningOutlined />}>Pending</Tag>,
      filters: [{ text: "Completed", value: true }, { text: "Pending", value: false }],
      onFilter: (value, record) => record.safetyInduction === value,
    },
    {
      title: "ID Verified",
      key: "idVerified",
      render: (_, v) => <Tag color={v.idVerified ? "success" : "default"}>{v.idVerified ? "Verified" : "Not Verified"}</Tag>,
    },
    {
      title: "Access Expiry",
      key: "accessExpiry",
      render: (_, v) => {
        if (!v.accessExpiry) return <Text type="secondary">—</Text>;
        const d = new Date(v.accessExpiry);
        const expired = d < new Date();
        return <Tag color={expired ? "error" : "success"}>{d.toLocaleDateString()}{expired ? " (Expired)" : ""}</Tag>;
      },
      sorter: (a, b) => {
        if (!a.accessExpiry) return 1;
        if (!b.accessExpiry) return -1;
        return new Date(a.accessExpiry).getTime() - new Date(b.accessExpiry).getTime();
      },
    },
    {
      title: "Documents",
      key: "docs",
      render: (_, v) => <Text>{v.documents.length} file{v.documents.length !== 1 ? "s" : ""}</Text>,
    },
    {
      title: "Visits",
      key: "visits",
      render: (_, v) => <Text>{v._count.visitorLogs}</Text>,
    },
  ];

  const expiredCount = visitors.filter(v => v.accessExpiry && new Date(v.accessExpiry) < new Date()).length;
  const noInduction = visitors.filter(v => !v.safetyInduction).length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}><ToolOutlined /> Contractor & Vendor Management</Title>
        <Text type="secondary">Track contractor access, safety inductions, and work permits</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Total" value={visitors.length} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Contractors" value={visitors.filter(v => v.visitorType === "CONTRACTOR").length} valueStyle={{ color: "#fa8c16" }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="Expired Access" value={expiredCount} valueStyle={{ color: "#ff4d4f" }} prefix={<WarningOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="No Induction" value={noInduction} valueStyle={{ color: "#faad14" }} /></Card>
        </Col>
      </Row>

      <Card title={`Contractors & Vendors (${filtered.length})`} extra={
        <Input prefix={<SearchOutlined />} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} allowClear />
      }>
        <Table<ContractorVisitor>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          locale={{ emptyText: "No contractors or vendors found" }}
        />
      </Card>
    </div>
  );
}
