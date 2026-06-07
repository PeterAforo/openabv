"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, X, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePusherEvent } from "@/hooks/use-pusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";

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

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  STAFF: "bg-blue-100 text-blue-700",
  DEPARTMENT_HEAD: "bg-blue-100 text-blue-700",
  SECURITY: "bg-orange-100 text-orange-700",
  RECEPTIONIST: "bg-green-100 text-green-700",
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

  // Fetch existing messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat?walkInRequestId=${walkInRequestId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {
        console.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [walkInRequestId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time message listener via Pusher
  usePusherEvent(
    CHANNELS.chat(walkInRequestId),
    EVENTS.CHAT_MESSAGE,
    (data: unknown) => {
      const msg = data as ChatMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walkInRequestId,
          message: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setNewMessage("");
      }
    } catch {
      console.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  const isOwnMessage = (msg: ChatMessage) => msg.sender?.id === session?.user?.id;

  const containerClass = compact
    ? "flex flex-col h-[350px]"
    : "flex flex-col h-[500px]";

  return (
    <Card className={`${containerClass} overflow-hidden`}>
      <CardHeader className="flex-shrink-0 py-3 px-4 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Chat — {visitorName}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading && (
          <p className="text-center text-sm text-muted-foreground py-4">Loading messages...</p>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No messages yet. Start the conversation!
          </p>
        )}

        {messages.map((msg) => {
          const own = isOwnMessage(msg);
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${own ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {own ? "You" : `${msg.sender.firstName} ${msg.sender.lastName}`}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1 py-0 ${roleBadgeColor[msg.sender.role] || ""}`}
                >
                  {msg.sender.role.replace("_", " ")}
                </Badge>
              </div>
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${
                  own
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.message}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="flex-shrink-0 border-t p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
