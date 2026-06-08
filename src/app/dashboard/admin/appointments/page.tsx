"use client";

import React, { useState, useEffect } from "react";
import { Button, Input, Select, Spin, Table, Tag, Typography } from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

const statusTagColor: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  DECLINED: "error",
  RESCHEDULED: "processing",
  CANCELLED: "default",
  CHECKED_IN: "cyan",
  CHECKED_OUT: "geekblue",
  NO_SHOW: "volcano",
  COMPLETED: "purple",
};

interface Appointment {
  id: string;
  appointmentCode: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  visitor: { firstName: string; lastName: string; phone: string };
  recipient: { firstName: string; lastName: string };
  department?: { name: string } | null;
}

function exportAppointmentsCSV(appointments: Appointment[]) {
  const headers = ["Code", "Visitor", "Phone", "Recipient", "Date", "Time", "Status", "Purpose"];
  const rows = appointments.map((a) => [
    a.appointmentCode,
    `${a.visitor.firstName} ${a.visitor.lastName}`,
    a.visitor.phone,
    `${a.recipient.firstName} ${a.recipient.lastName}`,
    new Date(a.date).toLocaleDateString(),
    new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    a.status,
    a.purpose,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointments-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  async function fetchAppointments() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }

  const columns: ColumnsType<Appointment> = [
    { title: "Code", dataIndex: "appointmentCode", key: "code", render: (v: string) => <Text code>{v}</Text> },
    {
      title: "Visitor", key: "visitor",
      render: (_, r) => <div><Text strong>{r.visitor.firstName} {r.visitor.lastName}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.visitor.phone}</Text></div>,
    },
    {
      title: "Recipient", key: "recipient",
      render: (_, r) => <div><Text>{r.recipient.firstName} {r.recipient.lastName}</Text>{r.department && <><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.department.name}</Text></>}</div>,
    },
    { title: "Date", dataIndex: "date", key: "date", render: (v: string) => new Date(v).toLocaleDateString() },
    { title: "Time", dataIndex: "startTime", key: "time", render: (v: string) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    { title: "Status", dataIndex: "status", key: "status", render: (s: string) => <Tag color={statusTagColor[s] || "default"}>{s}</Tag> },
    { title: "Purpose", dataIndex: "purpose", key: "purpose", ellipsis: true },
  ];

  const filtered = appointments.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.appointmentCode.toLowerCase().includes(q) ||
      `${a.visitor.firstName} ${a.visitor.lastName}`.toLowerCase().includes(q) ||
      a.visitor.phone.includes(q) ||
      `${a.recipient.firstName} ${a.recipient.lastName}`.toLowerCase().includes(q);
  });

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>All Appointments</Title>
          <Text type="secondary">{appointments.length} appointments</Text>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }} options={[
            { label: "All Statuses", value: "all" },
            { label: "Pending", value: "PENDING" },
            { label: "Approved", value: "APPROVED" },
            { label: "Declined", value: "DECLINED" },
            { label: "Checked In", value: "CHECKED_IN" },
            { label: "Completed", value: "COMPLETED" },
            { label: "No Show", value: "NO_SHOW" },
          ]} />
          <Button icon={<DownloadOutlined />} onClick={() => exportAppointmentsCSV(appointments)}>Export</Button>
        </div>
      </div>

      <Input prefix={<SearchOutlined />} placeholder="Search appointments..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ marginBottom: 16, maxWidth: 320 }} />

      <Table<Appointment> columns={columns} dataSource={filtered} rowKey="id" pagination={{ pageSize: 20, showSizeChanger: true }} />
    </div>
  );
}
