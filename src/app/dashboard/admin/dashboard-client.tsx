"use client";

import { Row, Col, Card, Tag, Typography, List } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserSwitchOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { KPICard } from "@/components/dashboard/kpi-card";
import { formatDate, formatTime } from "@/lib/utils";

const { Title, Text } = Typography;

interface Props {
  stats: {
    totalAppointments: number;
    todayAppointments: number;
    pendingAppointments: number;
    currentVisitors: number;
    totalVisitors: number;
    walkInRequests: number;
  };
  recentAppointments: {
    id: string;
    visitorName: string;
    recipientName: string;
    date: string;
    startTime: string;
    status: string;
  }[];
}

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
  ARRIVED: "blue",
};

export function AdminDashboardClient({ stats, recentAppointments }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
        <Text type="secondary">Overview of appointments and visitors</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <KPICard title="Total Appointments" value={stats.totalAppointments} icon={<CalendarOutlined />} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <KPICard title="Today's Appointments" value={stats.todayAppointments} icon={<ClockCircleOutlined />} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <KPICard title="Pending Approval" value={stats.pendingAppointments} icon={<ExclamationCircleOutlined />} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <KPICard title="Currently Inside" value={stats.currentVisitors} icon={<UserSwitchOutlined />} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <KPICard title="Today's Visitors" value={stats.totalVisitors} icon={<TeamOutlined />} />
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <KPICard title="Walk-In Requests" value={stats.walkInRequests} icon={<CheckCircleOutlined />} />
        </Col>
      </Row>

      <Card title="Recent Appointments">
        <List
          dataSource={recentAppointments}
          locale={{ emptyText: "No appointments yet" }}
          renderItem={(apt) => (
            <List.Item
              extra={<Tag color={statusTagColor[apt.status] || "default"}>{apt.status}</Tag>}
            >
              <List.Item.Meta
                title={apt.visitorName}
                description={
                  <>
                    <Text type="secondary" style={{ fontSize: 12 }}>With: {apt.recipientName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(apt.date)} {formatTime(apt.startTime)}</Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
