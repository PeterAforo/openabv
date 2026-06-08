"use client";

import { useState, useEffect } from "react";
import { Card, Col, Row, Select, Statistic, Table, Tag, Typography, Spin } from "antd";
import { BarChartOutlined, ClockCircleOutlined, UserDeleteOutlined, TeamOutlined, RiseOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface Analytics {
  period: number;
  summary: {
    totalVisitors: number;
    walkIns: number;
    appointments: number;
    walkInRatio: number;
    noShowRate: number;
    avgWaitMinutes: number;
  };
  departmentVisits: { department: string; count: number }[];
  staffVisitFrequency: { staff: string; count: number }[];
  dailyTraffic: { date: string; dayName: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

const { Title, Text } = Typography;

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState("30");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, [period]);

  async function fetchAnalytics() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/analytics?period=${period}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  if (isLoading || !data) {
    return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;
  }

  const maxTraffic = Math.max(...data.dailyTraffic.map(d => d.count), 1);

  const deptColumns: ColumnsType<{ department: string; count: number }> = [
    { title: "Department", dataIndex: "department", key: "department" },
    { title: "Visits", dataIndex: "count", key: "count", sorter: (a, b) => a.count - b.count },
  ];

  const staffColumns: ColumnsType<{ staff: string; count: number }> = [
    { title: "#", key: "rank", render: (_, __, i) => i + 1, width: 40 },
    { title: "Staff", dataIndex: "staff", key: "staff" },
    { title: "Visits", dataIndex: "count", key: "count" },
  ];

  const statusColumns: ColumnsType<{ status: string; count: number }> = [
    { title: "Status", dataIndex: "status", key: "status", render: (s: string) => <Tag>{s}</Tag> },
    { title: "Count", dataIndex: "count", key: "count" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><BarChartOutlined /> Advanced Analytics</Title>
          <Text type="secondary">Visitor traffic and performance metrics</Text>
        </div>
        <Select value={period} onChange={setPeriod} style={{ width: 140 }} options={[
          { label: "Last 7 days", value: "7" },
          { label: "Last 30 days", value: "30" },
          { label: "Last 90 days", value: "90" },
        ]} />
      </div>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small"><Statistic title="Total Visitors" value={data.summary.totalVisitors} prefix={<TeamOutlined />} valueStyle={{ color: "#0A2540" }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small"><Statistic title="Appointments" value={data.summary.appointments} prefix={<RiseOutlined />} valueStyle={{ color: "#52c41a" }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small"><Statistic title="Walk-Ins" value={data.summary.walkIns} valueStyle={{ color: "#fa8c16" }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small"><Statistic title="Walk-In Ratio" value={data.summary.walkInRatio} suffix="%" /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small"><Statistic title="No-Show Rate" value={data.summary.noShowRate} suffix="%" prefix={<UserDeleteOutlined />} valueStyle={{ color: "#ff4d4f" }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small"><Statistic title="Avg Wait" value={data.summary.avgWaitMinutes} suffix="min" prefix={<ClockCircleOutlined />} valueStyle={{ color: "#722ed1" }} /></Card>
        </Col>
      </Row>

      {/* Daily Traffic Bar Chart */}
      <Card title="Daily Visitor Traffic (Last 7 Days)" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
          {data.dailyTraffic.map((day) => (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{day.count}</span>
              <div style={{ width: "100%", background: "#0A2540", borderRadius: "4px 4px 0 0", height: `${(day.count / maxTraffic) * 100}%`, minHeight: day.count > 0 ? 4 : 0, transition: "height 0.3s" }} />
              <span style={{ fontSize: 11, color: "#8c8c8c" }}>{day.dayName}</span>
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Department Visit Volume" size="small">
            <Table columns={deptColumns} dataSource={data.departmentVisits} rowKey="department" pagination={false} size="small" locale={{ emptyText: "No data" }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Top Staff by Visits" size="small">
            <Table columns={staffColumns} dataSource={data.staffVisitFrequency} rowKey="staff" pagination={false} size="small" locale={{ emptyText: "No data" }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Appointment Status Breakdown" size="small">
            <Table columns={statusColumns} dataSource={data.statusBreakdown} rowKey="status" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
