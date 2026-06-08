"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Input, Spin, Switch, Tabs, Typography } from "antd";
import { SaveOutlined, SettingOutlined, MessageOutlined, MailOutlined, WifiOutlined, GoogleOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface GatewayField {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "toggle";
  placeholder?: string;
  description?: string;
}

interface GatewayTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: string;
  description: string;
  fields: GatewayField[];
}

const gatewayTabs: GatewayTab[] = [
  {
    id: "general", label: "General", icon: <SettingOutlined />, group: "general",
    description: "General application settings",
    fields: [
      { key: "app_name", label: "Application Name", type: "text", placeholder: "VisitFlow" },
      { key: "app_url", label: "Application URL", type: "text", placeholder: "http://localhost:3000" },
      { key: "timezone", label: "Timezone", type: "text", placeholder: "Africa/Accra" },
      { key: "appointment_auto_approve", label: "Auto-Approve Appointments", type: "toggle", description: "Automatically approve new appointment requests" },
    ],
  },
  {
    id: "sms", label: "SMS (mNotify)", icon: <MessageOutlined />, group: "sms",
    description: "Configure mNotify SMS gateway for alerts and reminders",
    fields: [
      { key: "sms_enabled", label: "Enable SMS Notifications", type: "toggle", description: "Send SMS via mNotify" },
      { key: "sms_api_key", label: "mNotify API Key", type: "password", placeholder: "Your mNotify API key" },
      { key: "sms_sender_id", label: "Sender ID", type: "text", placeholder: "VisitFlow", description: "Max 11 characters" },
    ],
  },
  {
    id: "email", label: "Email (SMTP)", icon: <MailOutlined />, group: "email",
    description: "Configure SMTP email gateway for notifications",
    fields: [
      { key: "email_enabled", label: "Enable Email Notifications", type: "toggle", description: "Send email notifications" },
      { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587" },
      { key: "smtp_user", label: "SMTP Username", type: "text", placeholder: "noreply@example.com" },
      { key: "smtp_pass", label: "SMTP Password", type: "password", placeholder: "App password" },
      { key: "email_from", label: "From Address", type: "text", placeholder: "noreply@visitflow.io" },
    ],
  },
  {
    id: "pusher", label: "Pusher (Real-time)", icon: <WifiOutlined />, group: "pusher",
    description: "Configure Pusher for real-time chat and notifications",
    fields: [
      { key: "pusher_enabled", label: "Enable Real-time Features", type: "toggle", description: "Enable live chat via Pusher" },
      { key: "pusher_app_id", label: "App ID", type: "text", placeholder: "Pusher App ID" },
      { key: "pusher_key", label: "Key", type: "text", placeholder: "Pusher Key" },
      { key: "pusher_secret", label: "Secret", type: "password", placeholder: "Pusher Secret" },
      { key: "pusher_cluster", label: "Cluster", type: "text", placeholder: "eu" },
    ],
  },
  {
    id: "google", label: "Google", icon: <GoogleOutlined />, group: "google",
    description: "Configure Google OAuth and Calendar integration",
    fields: [
      { key: "google_enabled", label: "Enable Google Integration", type: "toggle", description: "Enable Google OAuth & Calendar" },
      { key: "google_client_id", label: "Client ID", type: "text", placeholder: "Google OAuth Client ID" },
      { key: "google_client_secret", label: "Client Secret", type: "password", placeholder: "Client Secret" },
      { key: "google_redirect_uri", label: "Redirect URI", type: "text", placeholder: "http://localhost:3000/api/auth/callback/google" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const s of data.settings || []) map[s.key] = s.value;
      setValues(map);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }

  function updateValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function saveTab(group: string) {
    setIsSaving(true);
    try {
      const tab = gatewayTabs.find((t) => t.group === group);
      if (!tab) return;
      const settings = tab.fields.map((f) => ({ key: f.key, value: values[f.key] || "", group }));
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${tab.label} settings saved`);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  const tabItems = gatewayTabs.map((tab) => ({
    key: tab.id,
    label: <span>{tab.icon} {tab.label}</span>,
    children: (
      <Card title={<>{tab.icon} {tab.label}</>} extra={<Text type="secondary">{tab.description}</Text>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {tab.fields.map((field) => (
            <div key={field.key}>
              {field.type === "toggle" ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "1px solid #f0f0f0", borderRadius: 8 }}>
                  <div>
                    <Text strong>{field.label}</Text>
                    {field.description && <div><Text type="secondary" style={{ fontSize: 12 }}>{field.description}</Text></div>}
                  </div>
                  <Switch checked={values[field.key] === "true"} onChange={(checked) => updateValue(field.key, checked ? "true" : "false")} />
                </div>
              ) : (
                <div>
                  <Text strong style={{ display: "block", marginBottom: 4 }}>{field.label}</Text>
                  {field.description && <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>{field.description}</Text>}
                  {field.type === "password" ? (
                    <Input.Password value={values[field.key] || ""} onChange={(e) => updateValue(field.key, e.target.value)} placeholder={field.placeholder} />
                  ) : (
                    <Input value={values[field.key] || ""} onChange={(e) => updateValue(field.key, e.target.value)} placeholder={field.placeholder} type={field.type === "number" ? "number" : "text"} />
                  )}
                </div>
              )}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={() => saveTab(tab.group)} loading={isSaving}>
              Save {tab.label} Settings
            </Button>
          </div>
        </div>
      </Card>
    ),
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>System Settings</Title>
        <Text type="secondary">Configure application behavior and API gateways</Text>
      </div>
      <Tabs defaultActiveKey="general" items={tabItems} />
    </div>
  );
}
