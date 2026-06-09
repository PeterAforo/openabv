"use client";

import React, { useState, useEffect } from "react";
import { Card, Empty, Spin, Tag, Typography } from "antd";
import { MessageOutlined, TeamOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import LiveChat from "@/components/dashboard/live-chat";

const { Title, Text } = Typography;

const decisionTagColor: Record<string, string> = {
  PENDING: "warning",
  APPROVED: "success",
  WAIT: "processing",
  DECLINED: "error",
};

interface Conversation {
  id: string;
  decision: string;
  purpose: string;
  createdAt: string;
  visitor: { firstName: string; lastName: string; phone: string; company?: string };
  recipient: { firstName: string; lastName: string };
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/walkins");
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
        }
      } catch {
        toast.error("Failed to load conversations");
      } finally {
        setIsLoading(false);
      }
    }
    fetchConversations();
  }, []);

  const activeConvo = conversations.find((c) => c.id === activeChatId);

  if (isLoading) return <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Live Chat</Title>
        <Text type="secondary">Instant communication about walk-in visitor requests</Text>
      </div>

      <div className="vf-chat-grid" style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 24 }}>
        <Card className="vf-chat-conversations" title={<><TeamOutlined /> Conversations ({conversations.length})</>} style={{ height: 600, overflow: "hidden", display: "flex", flexDirection: "column" }} bodyStyle={{ flex: 1, overflowY: "auto", padding: 0 }}>
          {conversations.length === 0 ? (
            <Empty description="No conversations yet" style={{ padding: "40px 0" }} />
          ) : (
            conversations.map((convo) => (
              <div
                key={convo.id}
                onClick={() => setActiveChatId(convo.id)}
                style={{
                  padding: "10px 16px", borderBottom: "1px solid #f0f0f0", cursor: "pointer",
                  background: activeChatId === convo.id ? "#f5f5f5" : "transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text strong style={{ fontSize: 13 }}>{convo.visitor.firstName} {convo.visitor.lastName}</Text>
                  <Tag color={decisionTagColor[convo.decision] || "default"} style={{ fontSize: 10 }}>{convo.decision}</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>To: {convo.recipient.firstName} {convo.recipient.lastName}</Text>
                <div><Text type="secondary" style={{ fontSize: 11 }} ellipsis>{convo.purpose}</Text></div>
                <Text type="secondary" style={{ fontSize: 10 }}>{new Date(convo.createdAt).toLocaleString()}</Text>
              </div>
            ))
          )}
        </Card>

        <div>
          {activeConvo ? (
            <LiveChat
              walkInRequestId={activeConvo.id}
              visitorName={`${activeConvo.visitor.firstName} ${activeConvo.visitor.lastName}`}
              onClose={() => setActiveChatId(null)}
            />
          ) : (
            <Card className="vf-chat-panel" style={{ height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Empty image={<MessageOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />} description="Select a conversation to start chatting" />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
