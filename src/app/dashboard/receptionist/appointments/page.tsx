"use client";

import React, { useState, useEffect } from "react";
import { Empty, Input, Select, Space, Spin, Table, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

const statusTagColor: Record<string, string> = {
  PENDING: "warning", APPROVED: "success", CHECKED_IN: "green", DECLINED: "error", COMPLETED: "default",
};

interface Appointment {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
}

export default function ReceptionistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/appointments?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch {
        toast.error("Failed to load appointments");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const filtered = appointments.filter((a) =>
    `${a.visitor.firstName} ${a.visitor.lastName} ${a.appointmentCode}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnsType<Appointment> = [
    {
      title: "Visitor", key: "visitor",
      render: (_, apt) => <><Text strong>{apt.visitor.firstName} {apt.visitor.lastName}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{apt.visitor.phone}</Text></>,
    },
    { title: "Code", dataIndex: "appointmentCode", key: "code", render: (v: string) => <Text code>{v}</Text> },
    { title: "Host", key: "host", render: (_, apt) => `${apt.recipient.firstName} ${apt.recipient.lastName}` },
    { title: "Purpose", dataIndex: "purpose", key: "purpose", ellipsis: true },
    { title: "Status", dataIndex: "status", key: "status", render: (v: string) => <Tag color={statusTagColor[v] || "default"}>{v}</Tag> },
    { title: "Date", dataIndex: "date", key: "date", render: (v: string) => new Date(v).toLocaleDateString() },
    { title: "Time", dataIndex: "startTime", key: "time", render: (v: string) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ];

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Appointments</Title>
        <Text type="secondary">View today&apos;s and upcoming appointments</Text>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input prefix={<SearchOutlined />} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear style={{ width: 250 }} />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }} options={[
          { label: "All", value: "all" },
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Checked In", value: "CHECKED_IN" },
          { label: "Completed", value: "COMPLETED" },
        ]} />
      </Space>

      <Table<Appointment> columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 20, showSizeChanger: true }} locale={{ emptyText: <Empty description="No appointments found" /> }} />
    </div>
  );
}
