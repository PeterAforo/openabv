"use client";

import { Card, Col, Empty, List, Row, Tag, Typography } from "antd";
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, MessageOutlined } from "@ant-design/icons";
import { KPICard } from "@/components/dashboard/kpi-card";

const { Title, Text } = Typography;

const statusTagColor: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  DECLINED: "error",
};

interface Props {
  stats: { totalAppointments: number; pendingAppointments: number; pendingWalkins: number; todayAppointments: number };
  appointments: { id: string; visitorName: string; purpose: string; date: string; startTime: string; status: string }[];
}

export function StaffDashboardView({ stats, appointments }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>My Dashboard</Title>
        <Text type="secondary">Your appointments and visitor requests</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}><KPICard title="Total Appointments" value={stats.totalAppointments} icon={<CalendarOutlined />} /></Col>
        <Col xs={12} md={6}><KPICard title="Pending Approval" value={stats.pendingAppointments} icon={<ClockCircleOutlined />} /></Col>
        <Col xs={12} md={6}><KPICard title="Walk-In Requests" value={stats.pendingWalkins} icon={<UserOutlined />} /></Col>
        <Col xs={12} md={6}><KPICard title="Today's Meetings" value={stats.todayAppointments} icon={<MessageOutlined />} /></Col>
      </Row>

      <Card title="Upcoming Appointments">
        {appointments.length === 0 ? (
          <Empty description="No upcoming appointments" />
        ) : (
          <List
            dataSource={appointments}
            renderItem={(apt) => (
              <List.Item key={apt.id} actions={[<Tag key="status" color={statusTagColor[apt.status] || "default"}>{apt.status}</Tag>]}>
                <List.Item.Meta
                  title={apt.visitorName}
                  description={<><Text type="secondary">{apt.purpose}</Text> · <Text type="secondary" style={{ fontSize: 11 }}>{new Date(apt.date).toLocaleDateString()} {new Date(apt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text></>}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
