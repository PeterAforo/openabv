"use client";

import { Card, Empty, List, Tag, Typography } from "antd";

const { Title, Text } = Typography;

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
}

export function AuditLogList({ logs }: { logs: AuditLog[] }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Audit Logs</Title>
        <Text type="secondary">Track all important system actions</Text>
      </div>

      {logs.length === 0 ? (
        <Card><Empty description="No audit logs yet" /></Card>
      ) : (
        <List
          dataSource={logs}
          renderItem={(log) => (
            <List.Item
              key={log.id}
              style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }}
            >
              <List.Item.Meta
                title={<><Tag>{log.action}</Tag> <Text strong>{log.entity}</Text>{log.entityId && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>#{log.entityId.slice(0, 8)}</Text>}</>}
                description={<>
                  {log.user && <Text type="secondary">{log.user.firstName} {log.user.lastName} ({log.user.email})</Text>}
                  {log.ipAddress && <Text type="secondary" style={{ marginLeft: 8 }}>IP: {log.ipAddress}</Text>}
                </>}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{new Date(log.createdAt).toLocaleString()}</Text>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
