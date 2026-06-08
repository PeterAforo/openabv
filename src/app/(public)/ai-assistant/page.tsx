"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Input, Typography, Spin, Tag, Avatar } from "antd";
import { RobotOutlined, SendOutlined, UserOutlined, ArrowLeftOutlined, InfoCircleOutlined } from "@ant-design/icons";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "How do I book an appointment?",
  "What documents should I bring?",
  "What are your visiting hours?",
  "How does walk-in visiting work?",
  "Which departments can I visit?",
  "How do I check my appointment status?",
];

export default function PublicAIAssistantPage() {
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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.ok ? data.reply : (data.error || "Sorry, I encountered an error."), timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm unable to connect right now. Please try again later.", timestamp: new Date() },
      ]);
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: '#0A2540' }}>
                <span style={{ color: '#00C48C' }} className="font-bold text-sm">VF</span>
              </div>
              <span className="font-bold text-xl">VisitFlow</span>
            </Link>
            <Tag color="blue">AI Assistant</Tag>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/book-appointment" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              Book Appointment
            </Link>
            <Link href="/" className="px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-1">
              <ArrowLeftOutlined /> Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 container mx-auto max-w-3xl px-4 py-6 flex flex-col" style={{ maxHeight: "calc(100vh - 64px)" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <Avatar size={72} style={{ background: "#0A2540" }} icon={<RobotOutlined />} />
              <Title level={3} style={{ margin: 0 }}>Hi! I&apos;m your AI Reception Assistant</Title>
              <Text type="secondary" style={{ textAlign: "center", maxWidth: 450 }}>
                I can help you with booking appointments, finding departments, understanding visitor procedures, and answering common questions.
              </Text>

              <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedQuestions.map((q) => (
                  <Tag
                    key={q}
                    style={{ cursor: "pointer", padding: "6px 14px", fontSize: 13 }}
                    color="blue"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </Tag>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar
                    size={36}
                    style={{ background: msg.role === "user" ? "#52c41a" : "#0A2540", flexShrink: 0 }}
                    icon={msg.role === "user" ? <UserOutlined /> : <RobotOutlined />}
                  />
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "10px 16px",
                      borderRadius: 14,
                      background: msg.role === "user" ? "#e6f4ff" : "#fff",
                      border: msg.role === "user" ? "none" : "1px solid #f0f0f0",
                      borderTopRightRadius: msg.role === "user" ? 2 : 14,
                      borderTopLeftRadius: msg.role === "user" ? 14 : 2,
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
                <div className="flex gap-3">
                  <Avatar size={36} style={{ background: "#0A2540", flexShrink: 0 }} icon={<RobotOutlined />} />
                  <div style={{ padding: "10px 16px", borderRadius: 14, background: "#fff", border: "1px solid #f0f0f0", borderTopLeftRadius: 2 }}>
                    <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Thinking...</Text>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t bg-white rounded-xl shadow-sm p-3 mt-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => sendMessage()}
            placeholder="Ask me anything about appointments, departments, or visiting..."
            disabled={isLoading}
            maxLength={1000}
            size="large"
            variant="borderless"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="large"
          />
        </div>

        <div className="text-center mt-2 flex items-center justify-center gap-1">
          <InfoCircleOutlined style={{ color: "#8c8c8c", fontSize: 11 }} />
          <Text type="secondary" style={{ fontSize: 11 }}>Powered by OpenAI · Responses may not always be accurate</Text>
        </div>
      </div>
    </div>
  );
}
