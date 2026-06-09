"use client";

import { useState, useEffect } from "react";
import { Button, Card, Input, Select, Table, Tag, Typography } from "antd";
import { FileTextOutlined, SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface VisitorDocument {
  id: string;
  visitorId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  isVerified: boolean;
  expiresAt?: string;
  createdAt: string;
  visitor: { firstName: string; lastName: string };
}

const typeTagColor: Record<string, string> = {
  INVITATION_LETTER: "blue",
  ID_DOCUMENT: "purple",
  WORK_PERMIT: "orange",
  SAFETY_INDUCTION: "green",
  DELIVERY_NOTE: "cyan",
  CONTRACT: "geekblue",
  OTHER: "default",
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<VisitorDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  useEffect(() => { fetchDocs(); }, [typeFilter]);

  async function fetchDocs() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) setDocs(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  function formatSize(bytes?: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  const filtered = docs.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.fileName.toLowerCase().includes(q) ||
      `${d.visitor.firstName} ${d.visitor.lastName}`.toLowerCase().includes(q);
  });

  const columns: ColumnsType<VisitorDocument> = [
    {
      title: "Visitor",
      key: "visitor",
      render: (_, d) => <Text strong>{d.visitor.firstName} {d.visitor.lastName}</Text>,
      sorter: (a, b) => a.visitor.firstName.localeCompare(b.visitor.firstName),
    },
    { title: "File Name", dataIndex: "fileName", key: "fileName", ellipsis: true },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color={typeTagColor[t] || "default"}>{t.replace(/_/g, " ")}</Tag>,
    },
    { title: "Size", key: "size", render: (_, d) => formatSize(d.fileSize), width: 90 },
    {
      title: "Verified",
      dataIndex: "isVerified",
      key: "isVerified",
      render: (v: boolean) => <Tag color={v ? "success" : "warning"}>{v ? "Verified" : "Pending"}</Tag>,
      width: 100,
    },
    {
      title: "Expires",
      key: "expires",
      render: (_, d) => d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—",
      width: 100,
    },
    {
      title: "Uploaded",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) => new Date(d).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      width: 100,
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_, d) => (
        <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
          <Button type="text" icon={<DownloadOutlined />} size="small" />
        </a>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><FileTextOutlined /> Document Manager</Title>
          <Text type="secondary">View and manage visitor documents, permits, and ID uploads</Text>
        </div>
      </div>

      <Card title={`Documents (${filtered.length})`} extra={
        <div style={{ display: "flex", gap: 8 }}>
          <Select
            placeholder="Filter by type"
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 180 }}
            options={[
              { label: "Invitation Letter", value: "INVITATION_LETTER" },
              { label: "ID Document", value: "ID_DOCUMENT" },
              { label: "Work Permit", value: "WORK_PERMIT" },
              { label: "Safety Induction", value: "SAFETY_INDUCTION" },
              { label: "Delivery Note", value: "DELIVERY_NOTE" },
              { label: "Contract", value: "CONTRACT" },
              { label: "Other", value: "OTHER" },
            ]}
          />
          <Input prefix={<SearchOutlined />} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} allowClear />
        </div>
      }>
        <Table<VisitorDocument>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 600 }}
          locale={{ emptyText: "No documents uploaded" }}
        />
      </Card>
    </div>
  );
}
