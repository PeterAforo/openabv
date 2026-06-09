"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Col, Input, Row, Select, Statistic, Table, Tag, Typography, Space, Empty } from "antd";
import {
  CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined,
  UserOutlined, WarningOutlined, SearchOutlined, DownloadOutlined, CloseCircleOutlined,
} from "@ant-design/icons";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface ReportData {
  stats: {
    totalAppointments: number;
    approvedCount: number;
    declinedCount: number;
    noShowCount: number;
    cancelledCount: number;
    checkedInCount: number;
    totalVisitorLogs: number;
    walkInCount: number;
    currentInside: number;
  };
  dailyBreakdown: { date: string; appointments: number; visitors: number }[];
  staffRanking: { id: string; name: string; department: string; count: number }[];
  visitorHistory: {
    visitor: { firstName: string; lastName: string; phone: string; company?: string };
    visits: { id: string; checkInTime: string; checkOutTime?: string; purpose: string; recipientName?: string; status: string; isWalkIn: boolean }[];
    appointments: { id: string; appointmentCode: string; date: string; status: string; purpose: string; recipient?: { firstName: string; lastName: string } }[];
  } | null;
  dateRange: { from: string; to: string };
}

interface Props {
  stats: {
    totalAppointments: number;
    weeklyAppointments: number;
    monthlyAppointments: number;
    totalVisitors: number;
    weeklyVisitors: number;
    walkIns: number;
    noShows: number;
    currentInside: number;
  };
}

export function ReportsDashboard({ stats: initialStats }: Props) {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [visitorPhone, setVisitorPhone] = useState("");

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (visitorPhone) params.set("visitorPhone", visitorPhone);
      const res = await fetch(`/api/admin/reports?${params}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [dateFrom, dateTo, visitorPhone]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const stats = data?.stats || {
    totalAppointments: initialStats.totalAppointments,
    approvedCount: 0, declinedCount: 0, noShowCount: initialStats.noShows,
    cancelledCount: 0, checkedInCount: 0,
    totalVisitorLogs: initialStats.totalVisitors, walkInCount: initialStats.walkIns,
    currentInside: initialStats.currentInside,
  };

  function exportCSV() {
    if (!data?.dailyBreakdown) return;
    const headers = ["Date", "Appointments", "Visitors"];
    const rows = data.dailyBreakdown.map(d => [d.date, d.appointments, d.visitors]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report-${dateFrom}-to-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const staffColumns: ColumnsType<{ id: string; name: string; department: string; count: number }> = [
    { title: "#", key: "rank", render: (_, __, i) => i + 1, width: 40 },
    { title: "Staff Member", dataIndex: "name", key: "name" },
    { title: "Department", dataIndex: "department", key: "dept" },
    { title: "Appointments", dataIndex: "count", key: "count", sorter: (a, b) => a.count - b.count },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Reports & Analytics</Title>
          <Text type="secondary">System-wide statistics and reports</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Date Range + Visitor Search */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>From</Text>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 150 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>To</Text>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 150 }} />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>Visitor Phone Lookup</Text>
            <Input.Search
              placeholder="Enter phone..."
              value={visitorPhone}
              onChange={e => setVisitorPhone(e.target.value)}
              onSearch={fetchReport}
              style={{ width: 200 }}
              allowClear
            />
          </div>
          <div style={{ paddingTop: 18 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={fetchReport} loading={isLoading}>
              Search
            </Button>
          </div>
        </Space>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Appointments" value={stats.totalAppointments} prefix={<CalendarOutlined />} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Approved" value={stats.approvedCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#00C48C" }} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Declined" value={stats.declinedCount} prefix={<CloseCircleOutlined />} valueStyle={{ color: "#ff4d4f" }} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="No-Shows" value={stats.noShowCount} prefix={<WarningOutlined />} valueStyle={{ color: "#fa8c16" }} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Walk-Ins" value={stats.walkInCount} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={12} md={4}><Card size="small"><Statistic title="Inside Now" value={stats.currentInside} prefix={<UserOutlined />} valueStyle={{ color: "#0A2540" }} /></Card></Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Daily Activity" size="small">
            {data?.dailyBreakdown && data.dailyBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="appointments" fill="#0A2540" name="Appointments" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="visitors" fill="#00C48C" name="Check-ins" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty description="No data for selected range" />}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Top Staff by Appointments" size="small">
            <Table
              columns={staffColumns}
              dataSource={data?.staffRanking || []}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: <Empty description="No data" /> }}
            />
          </Card>
        </Col>
      </Row>

      {/* Trend Line */}
      {data?.dailyBreakdown && data.dailyBreakdown.length > 1 && (
        <Card title="Appointment Trend" size="small" style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="appointments" stroke="#0A2540" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="visitors" stroke="#00C48C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Visitor History Lookup */}
      {data?.visitorHistory && (
        <Card title={`Visitor History: ${data.visitorHistory.visitor.firstName} ${data.visitorHistory.visitor.lastName}`} style={{ marginBottom: 16 }}>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}><Text type="secondary">Phone:</Text> <Text>{data.visitorHistory.visitor.phone}</Text></Col>
            <Col xs={12} sm={6}><Text type="secondary">Company:</Text> <Text>{data.visitorHistory.visitor.company || "-"}</Text></Col>
            <Col xs={12} sm={6}><Text type="secondary">Total Visits:</Text> <Text strong>{data.visitorHistory.visits.length}</Text></Col>
            <Col xs={12} sm={6}><Text type="secondary">Total Appointments:</Text> <Text strong>{data.visitorHistory.appointments.length}</Text></Col>
          </Row>
          <Title level={5}>Recent Visits</Title>
          <Table
            size="small"
            dataSource={data.visitorHistory.visits}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            columns={[
              { title: "Check-In", dataIndex: "checkInTime", render: (v: string) => new Date(v).toLocaleString() },
              { title: "Check-Out", dataIndex: "checkOutTime", render: (v: string | null) => v ? new Date(v).toLocaleString() : "-" },
              { title: "Host", dataIndex: "recipientName", render: (v: string | null) => v || "-" },
              { title: "Purpose", dataIndex: "purpose", ellipsis: true },
              { title: "Type", dataIndex: "isWalkIn", render: (v: boolean) => <Tag color={v ? "orange" : "blue"}>{v ? "Walk-In" : "Appointment"}</Tag> },
            ]}
          />
          <Title level={5} style={{ marginTop: 16 }}>Appointments</Title>
          <Table
            size="small"
            dataSource={data.visitorHistory.appointments}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            columns={[
              { title: "Code", dataIndex: "appointmentCode", render: (v: string) => <Tag style={{ fontFamily: "monospace" }}>{v}</Tag> },
              { title: "Date", dataIndex: "date", render: (v: string) => new Date(v).toLocaleDateString() },
              { title: "Host", key: "host", render: (_, r: { recipient?: { firstName: string; lastName: string } }) => r.recipient ? `${r.recipient.firstName} ${r.recipient.lastName}` : "-" },
              { title: "Purpose", dataIndex: "purpose", ellipsis: true },
              { title: "Status", dataIndex: "status", render: (s: string) => <Tag>{s}</Tag> },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
