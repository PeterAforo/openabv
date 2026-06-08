"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Card, Input, Spin, Tag, Typography } from "antd";
import { CloseOutlined, MessageOutlined, SendOutlined } from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { usePusherEvent } from "@/hooks/use-pusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";

const { Text } = Typography;

interface ChatMessage {
  id: string;
  message: string;
  senderId?: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
}

interface LiveChatProps {
  walkInRequestId: string;
  visitorName: string;
  onClose?: () => void;
  compact?: boolean;
}

const roleTagColor: Record<string, string> = {
  ADMIN: "purple", SUPER_ADMIN: "purple", STAFF: "blue", DEPARTMENT_HEAD: "blue", SECURITY: "orange", RECEPTIONIST: "green",
};

export default function LiveChat({ walkInRequestId, visitorName, onClose, compact = false }: LiveChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat?walkInRequestId=${walkInRequestId}`);
        if (res.ok) { const data = await res.json(); setMessages(data); }
      } catch { console.error("Failed to load messages"); } finally { setIsLoading(false); }
    }
    fetchMessages();
  }, [walkInRequestId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  usePusherEvent(CHANNELS.chat(walkInRequestId), EVENTS.CHAT_MESSAGE, (data: unknown) => {
    const msg = data as ChatMessage;
    setMessages((prev) => { if (prev.some((m) => m.id === msg.id)) return prev; return [...prev, msg]; });
  });

  async function handleSend() {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walkInRequestId, message: newMessage.trim() }) });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => { if (prev.some((m) => m.id === msg.id)) return prev; return [...prev, msg]; });
        setNewMessage("");
      }
    } catch { console.error("Failed to send message"); } finally { setIsSending(false); }
  }

  const isOwnMessage = (msg: ChatMessage) => msg.sender?.id === session?.user?.id;
  const height = compact ? 350 : 500;

  return (
    <Card
      title={<><MessageOutlined /> Chat — {visitorName}</>}
      extra={onClose && <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: height - 57 } }}
      style={{ height, overflow: "hidden" }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading && <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>}
        {!isLoading && messages.length === 0 && <Text type="secondary" style={{ textAlign: "center", padding: 32 }}>No messages yet. Start the conversation!</Text>}
        {messages.map((msg) => {
          const own = isOwnMessage(msg);
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <Text style={{ fontSize: 11 }} type="secondary">{own ? "You" : `${msg.sender.firstName} ${msg.sender.lastName}`}</Text>
                <Tag color={roleTagColor[msg.sender.role] || "default"} style={{ fontSize: 10, lineHeight: "16px", margin: 0, padding: "0 4px" }}>{msg.sender.role.replace("_", " ")}</Tag>
              </div>
              <div style={{ borderRadius: 8, padding: "6px 12px", maxWidth: "80%", fontSize: 14, background: own ? "#1677ff" : "#f5f5f5", color: own ? "#fff" : undefined }}>
                {msg.message}
              </div>
              <Text style={{ fontSize: 10, marginTop: 2 }} type="secondary">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ borderTop: "1px solid #f0f0f0", padding: 12, display: "flex", gap: 8 }}>
        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onPressEnter={handleSend} placeholder="Type a message..." disabled={isSending} style={{ flex: 1 }} />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={isSending || !newMessage.trim()} />
      </div>
    </Card>
  );
}
