"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, MessageSquare, Mail, Radio, Globe, Settings2, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// --- Gateway config definitions ---

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
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  description: string;
  fields: GatewayField[];
}

const gatewayTabs: GatewayTab[] = [
  {
    id: "general",
    label: "General",
    icon: Settings2,
    group: "general",
    description: "General application settings",
    fields: [
      { key: "app_name", label: "Application Name", type: "text", placeholder: "OpenABV" },
      { key: "app_url", label: "Application URL", type: "text", placeholder: "http://localhost:3000" },
      { key: "timezone", label: "Timezone", type: "text", placeholder: "Africa/Accra" },
      { key: "appointment_auto_approve", label: "Auto-Approve Appointments", type: "toggle", description: "Automatically approve new appointment requests" },
    ],
  },
  {
    id: "sms",
    label: "SMS (mNotify)",
    icon: MessageSquare,
    group: "sms",
    description: "Configure mNotify SMS gateway for alerts and reminders",
    fields: [
      { key: "sms_enabled", label: "Enable SMS Notifications", type: "toggle", description: "Send SMS via mNotify for appointments, walk-ins, and reminders" },
      { key: "sms_api_key", label: "mNotify API Key", type: "password", placeholder: "Your mNotify API key" },
      { key: "sms_sender_id", label: "Sender ID", type: "text", placeholder: "OpenABV", description: "Max 11 characters, registered with mNotify" },
    ],
  },
  {
    id: "email",
    label: "Email (SMTP)",
    icon: Mail,
    group: "email",
    description: "Configure SMTP email gateway for notifications",
    fields: [
      { key: "email_enabled", label: "Enable Email Notifications", type: "toggle", description: "Send email notifications for appointments and alerts" },
      { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587" },
      { key: "smtp_user", label: "SMTP Username", type: "text", placeholder: "noreply@example.com" },
      { key: "smtp_pass", label: "SMTP Password", type: "password", placeholder: "App password" },
      { key: "email_from", label: "From Address", type: "text", placeholder: "noreply@openabv.com" },
    ],
  },
  {
    id: "pusher",
    label: "Pusher (Real-time)",
    icon: Radio,
    group: "pusher",
    description: "Configure Pusher for real-time chat and notifications",
    fields: [
      { key: "pusher_enabled", label: "Enable Real-time Features", type: "toggle", description: "Enable live chat, real-time notifications via Pusher" },
      { key: "pusher_app_id", label: "App ID", type: "text", placeholder: "Pusher App ID" },
      { key: "pusher_key", label: "Key", type: "text", placeholder: "Pusher Key" },
      { key: "pusher_secret", label: "Secret", type: "password", placeholder: "Pusher Secret" },
      { key: "pusher_cluster", label: "Cluster", type: "text", placeholder: "eu" },
    ],
  },
  {
    id: "google",
    label: "Google",
    icon: Globe,
    group: "google",
    description: "Configure Google OAuth and Calendar integration",
    fields: [
      { key: "google_enabled", label: "Enable Google Integration", type: "toggle", description: "Enable Google OAuth login and Calendar sync" },
      { key: "google_client_id", label: "Client ID", type: "text", placeholder: "Google OAuth Client ID" },
      { key: "google_client_secret", label: "Client Secret", type: "password", placeholder: "Google OAuth Client Secret" },
      { key: "google_redirect_uri", label: "Redirect URI", type: "text", placeholder: "http://localhost:3000/api/auth/callback/google" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const s of data.settings || []) {
        map[s.key] = s.value;
      }
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

      const settings = tab.fields.map((f) => ({
        key: f.key,
        value: values[f.key] || "",
        group,
      }));

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

  function togglePasswordVisibility(key: string) {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading settings...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure application behavior and API gateways</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {gatewayTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1.5">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {gatewayTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tab.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    {field.type === "toggle" ? (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">{field.label}</Label>
                          {field.description && (
                            <p className="text-sm text-muted-foreground">{field.description}</p>
                          )}
                        </div>
                        <Switch
                          checked={values[field.key] === "true"}
                          onCheckedChange={(checked) => updateValue(field.key, checked ? "true" : "false")}
                        />
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={field.key}>{field.label}</Label>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <div className="relative">
                          <Input
                            id={field.key}
                            type={field.type === "password" && !showPasswords[field.key] ? "password" : "text"}
                            value={values[field.key] || ""}
                            onChange={(e) => updateValue(field.key, e.target.value)}
                            placeholder={field.placeholder}
                          />
                          {field.type === "password" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => togglePasswordVisibility(field.key)}
                            >
                              {showPasswords[field.key] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => saveTab(tab.group)} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : `Save ${tab.label} Settings`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
