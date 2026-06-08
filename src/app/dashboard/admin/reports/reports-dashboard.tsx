"use client";

import { Card, Col, Row, Statistic, Typography } from "antd";
import { CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, UserOutlined, WarningOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

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

export function ReportsDashboard({ stats }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Reports & Analytics</Title>
        <Text type="secondary">System-wide statistics and reports</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Total Appointments" value={stats.totalAppointments} prefix={<CalendarOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="This Week" value={stats.weeklyAppointments} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="This Month" value={stats.monthlyAppointments} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Currently Inside" value={stats.currentInside} prefix={<TeamOutlined />} valueStyle={{ color: "#1677ff" }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Total Visitor Logs" value={stats.totalVisitors} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Weekly Visitors" value={stats.weeklyVisitors} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="Walk-Ins" value={stats.walkIns} prefix={<WarningOutlined />} valueStyle={{ color: "#fa8c16" }} /></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><Statistic title="No-Shows" value={stats.noShows} prefix={<WarningOutlined />} valueStyle={{ color: "#ff4d4f" }} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Appointment Summary">
            <Text type="secondary">
              Detailed charts and export functionality will be available in the next release.
              Current data can be viewed through Prisma Studio.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Visitor Statistics">
            <Text type="secondary">
              Department-level visitor statistics, peak hours analysis, and CSV export coming soon.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
