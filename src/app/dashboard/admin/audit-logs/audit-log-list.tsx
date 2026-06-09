"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Col, Empty, Input, Modal, Row, Select, Space, Table, Tag, Typography } from "antd";
import { SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; role?: string } | null;
}

const actionColors: Record<string, string> = {
  CREATE: "green", CREATED: "green", USER_CREATED: "green", DEPARTMENT_CREATED: "green", BRANCH_CREATED: "green",
  UPDATE: "blue", UPDATED: "blue", STATUS_CHANGE: "blue",
  DELETE: "red", DELETED: "red",
  LOGIN: "purple", LOGOUT: "purple",
  VISITOR_PRE_REGISTERED: "cyan", WALK_IN_REGISTERED: "orange",
  CHECK_IN: "processing", CHECK_OUT: "default",
};

function getActionColor(action: string): string {
  if (actionColors[action]) return actionColors[action];
  if (action.includes("CREATE")) return "green";
  if (action.includes("UPDATE") || action.includes("CHANGE")) return "blue";
  if (action.includes("DELETE")) return "red";
  return "default";
}

// This component now fetches its own data client-side for advanced search
export function AuditLogList({ logs: _initialLogs }: { logs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(_initialLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(_initialLogs.length);
  const [pageSize, setPageSize] = useState(25);
  const [filterActions, setFilterActions] = useState<string[]>([]);
  const [filterEntities, setFilterEntities] = useState<string[]>([]);
  const [detailItem, setDetailItem] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", pageSize.toString());
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity", entityFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.pagination?.total || 0);
        if (data.filters) {
          setFilterActions(data.filters.actions || []);
          setFilterEntities(data.filters.entities || []);
        }
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [page, pageSize, search, actionFilter, entityFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function exportCSV() {
    const headers = ["Date", "Action", "Entity", "Entity ID", "User", "IP"];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      l.action,
      l.entity,
      l.entityId || "",
      l.user ? `${l.user.firstName} ${l.user.lastName}` : "",
      l.ipAddress || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Timestamp", dataIndex: "createdAt", key: "time", width: 170,
      render: (v: string) => (
        <div>
          <Text style={{ fontSize: 13 }}>{new Date(v).toLocaleDateString()}</Text>
          <br /><Text type="secondary" style={{ fontSize: 11 }}>{new Date(v).toLocaleTimeString()}</Text>
        </div>
      ),
    },
    {
      title: "Action", dataIndex: "action", key: "action", width: 200,
      render: (a: string) => <Tag color={getActionColor(a)}>{a.replace(/_/g, " ")}</Tag>,
    },
    {
      title: "Entity", key: "entity", width: 160,
      render: (_, log) => (
        <div>
          <Text strong>{log.entity}</Text>
          {log.entityId && <div><Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>#{log.entityId.slice(0, 8)}</Text></div>}
        </div>
      ),
    },
    {
      title: "User", key: "user",
      render: (_, log) => log.user ? (
        <div>
          <Text>{log.user.firstName} {log.user.lastName}</Text>
          <br /><Text type="secondary" style={{ fontSize: 11 }}>{log.user.email}</Text>
        </div>
      ) : <Text type="secondary">System</Text>,
    },
    {
      title: "IP", dataIndex: "ipAddress", key: "ip", width: 120,
      render: (v: string | null) => <Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>{v || "-"}</Text>,
    },
    {
      title: "", key: "detail", width: 40,
      render: (_, log) => <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailItem(log)} />,
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Audit Logs</Title>
          <Text type="secondary">{total} total entries</Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={exportCSV}>Export CSV</Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search logs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            placeholder="Action"
            value={actionFilter || undefined}
            onChange={v => { setActionFilter(v || ""); setPage(1); }}
            allowClear
            style={{ width: 180 }}
            options={filterActions.map(a => ({ label: a.replace(/_/g, " "), value: a }))}
          />
          <Select
            placeholder="Entity"
            value={entityFilter || undefined}
            onChange={v => { setEntityFilter(v || ""); setPage(1); }}
            allowClear
            style={{ width: 150 }}
            options={filterEntities.map(e => ({ label: e, value: e }))}
          />
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={{ width: 140 }} placeholder="From" />
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={{ width: 140 }} placeholder="To" />
        </Space>
      </Card>

      <Card>
        <Table<AuditLog>
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `${t} entries`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{ emptyText: <Empty description="No audit logs found" /> }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Audit Log Details"
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        footer={null}
        width={600}
      >
        {detailItem && (
          <div>
            <Row gutter={[12, 12]}>
              <Col span={12}><Text type="secondary">Timestamp:</Text><br /><Text>{new Date(detailItem.createdAt).toLocaleString()}</Text></Col>
              <Col span={12}><Text type="secondary">Action:</Text><br /><Tag color={getActionColor(detailItem.action)}>{detailItem.action.replace(/_/g, " ")}</Tag></Col>
              <Col span={12}><Text type="secondary">Entity:</Text><br /><Text strong>{detailItem.entity}</Text></Col>
              <Col span={12}><Text type="secondary">Entity ID:</Text><br /><Text style={{ fontFamily: "monospace" }}>{detailItem.entityId || "-"}</Text></Col>
              <Col span={12}><Text type="secondary">User:</Text><br /><Text>{detailItem.user ? `${detailItem.user.firstName} ${detailItem.user.lastName} (${detailItem.user.email})` : "System"}</Text></Col>
              <Col span={12}><Text type="secondary">IP Address:</Text><br /><Text style={{ fontFamily: "monospace" }}>{detailItem.ipAddress || "-"}</Text></Col>
            </Row>
            {detailItem.oldValues != null && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Old Values:</Text>
                <pre style={{ background: "#F8FAFC", padding: 12, borderRadius: 8, fontSize: 12, maxHeight: 200, overflow: "auto" }}>
                  {JSON.stringify(detailItem.oldValues, null, 2)}
                </pre>
              </div>
            )}
            {detailItem.newValues != null && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">New Values:</Text>
                <pre style={{ background: "#F0FFF4", padding: 12, borderRadius: 8, fontSize: 12, maxHeight: 200, overflow: "auto" }}>
                  {JSON.stringify(detailItem.newValues, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
