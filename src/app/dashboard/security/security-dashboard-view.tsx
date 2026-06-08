"use client";

import { Card, Col, Empty, List, Row, Tag, Typography } from "antd";
import { TeamOutlined, UserOutlined, ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { KPICard } from "@/components/dashboard/kpi-card";

const { Title, Text } = Typography;

interface Props {
  stats: { currentVisitors: number; todayCheckins: number; todayCheckouts: number; pendingWalkins: number };
  visitors: { id: string; name: string; purpose: string; checkInTime: string; isWalkIn: boolean }[];
}

export function SecurityDashboardView({ stats, visitors }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Security Dashboard</Title>
        <Text type="secondary">Manage visitor check-ins and appointments</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}><KPICard title="Currently Inside" value={stats.currentVisitors} icon={<TeamOutlined />} /></Col>
        <Col xs={12} md={6}><KPICard title="Today's Check-Ins" value={stats.todayCheckins} icon={<UserOutlined />} /></Col>
        <Col xs={12} md={6}><KPICard title="Today's Check-Outs" value={stats.todayCheckouts} icon={<ClockCircleOutlined />} /></Col>
        <Col xs={12} md={6}><KPICard title="Pending Walk-Ins" value={stats.pendingWalkins} icon={<WarningOutlined />} /></Col>
      </Row>

      <Card title="Visitors Currently Inside">
        {visitors.length === 0 ? (
          <Empty description="No visitors currently inside" />
        ) : (
          <List
            dataSource={visitors}
            renderItem={(v) => (
              <List.Item key={v.id} actions={[<Tag key="type" color={v.isWalkIn ? "orange" : "blue"}>{v.isWalkIn ? "Walk-In" : "Appointment"}</Tag>]}>
                <List.Item.Meta
                  title={v.name}
                  description={<><Text type="secondary">{v.purpose}</Text> · <Text type="secondary" style={{ fontSize: 11 }}>In: {new Date(v.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text></>}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
