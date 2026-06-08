"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Card, Input, Typography, Spin, Tag, Avatar, Empty } from "antd";
import { RobotOutlined, SendOutlined, UserOutlined, DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { toast } from "sonner";

const { Title, Text, Paragraph } = Typography;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "How do I book an appointment?",
  "What documents do I need to bring?",
  "What are the visiting hours?",
  "How does the walk-in process work?",
  "Which departments can I visit?",
  "How do I check my appointment status?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, timestamp: new Date() },
        ]);
      } else {
        toast.error(data.error || "Failed to get response");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Sorry, I encountered an error. Please try again.", timestamp: new Date() },
        ]);
      }
    } catch {
      toast.error("Failed to connect to AI assistant");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm unable to connect right now. Please try again later.", timestamp: new Date() },
      ]);
    }
    setIsLoading(false);
  }

  function clearChat() {
    setMessages([]);
    setInput("");
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}><RobotOutlined /> AI Reception Assistant</Title>
          <Text type="secondary">Ask questions about appointments, departments, visiting procedures, and more</Text>
        </div>
        {messages.length > 0 && (
          <Button icon={<DeleteOutlined />} onClick={clearChat} size="small">Clear</Button>
        )}
      </div>

      <Card
        styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "calc(100vh - 260px)", minHeight: 400 } }}
      >
        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
              <Avatar size={64} style={{ background: "#1677ff" }} icon={<RobotOutlined />} />
              <Title level={4} style={{ margin: 0 }}>Welcome! How can I help?</Title>
              <Text type="secondary" style={{ textAlign: "center", maxWidth: 400 }}>
                I can help you with appointment booking, department routing, visitor procedures, and general inquiries.
              </Text>

              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500 }}>
                {suggestedQuestions.map((q) => (
                  <Tag
                    key={q}
                    style={{ cursor: "pointer", padding: "4px 12px", fontSize: 13 }}
                    color="blue"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </Tag>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 16,
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  }}
                >
                  <Avatar
                    size={32}
                    style={{ background: msg.role === "user" ? "#52c41a" : "#1677ff", flexShrink: 0 }}
                    icon={msg.role === "user" ? <UserOutlined /> : <RobotOutlined />}
                  />
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: msg.role === "user" ? "#e6f4ff" : "#f5f5f5",
                      borderTopRightRadius: msg.role === "user" ? 2 : 12,
                      borderTopLeftRadius: msg.role === "user" ? 12 : 2,
                    }}
                  >
                    <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 14 }}>
                      {msg.content}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <Avatar size={32} style={{ background: "#1677ff", flexShrink: 0 }} icon={<RobotOutlined />} />
                  <div style={{ padding: "10px 14px", borderRadius: 12, background: "#f5f5f5", borderTopLeftRadius: 2 }}>
                    <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Thinking...</Text>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8 }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => sendMessage()}
            placeholder="Ask me anything about appointments, departments, or visiting..."
            disabled={isLoading}
            maxLength={1000}
            size="large"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="large"
          />
        </div>

        {/* Info bar */}
        <div style={{ padding: "6px 16px", background: "#fafafa", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
          <InfoCircleOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 11 }}>Powered by OpenAI · Responses may not always be accurate</Text>
        </div>
      </Card>
    </div>
  );
}
