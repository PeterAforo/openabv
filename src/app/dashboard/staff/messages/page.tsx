"use client";

import React, { useState, useEffect } from "react";
import { Card, Empty, List, Spin, Tag, Typography } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text } = Typography;

interface ChatMessage {
  id: string;
  message: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  walkInRequestId: string;
}

export default function StaffMessagesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/chat?recent=true");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Messages</Title>
        <Text type="secondary">Walk-in chat conversations</Text>
      </div>

      {messages.length === 0 ? (
        <Card><Empty image={<MessageOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />} description={<><Text type="secondary">No messages yet</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>Messages from walk-in chats will appear here</Text></>} /></Card>
      ) : (
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item key={msg.id} style={{ background: "#fff", marginBottom: 8, padding: "12px 16px", borderRadius: 8, border: "1px solid #f0f0f0" }}>
              <List.Item.Meta
                avatar={<MessageOutlined style={{ fontSize: 18, marginTop: 4 }} />}
                title={<><Text strong>{msg.senderName}</Text> <Tag>{msg.senderRole}</Tag></>}
                description={<><Text>{msg.message}</Text><br /><Text type="secondary" style={{ fontSize: 11 }}>{new Date(msg.createdAt).toLocaleString()}</Text></>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
