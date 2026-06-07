"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

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

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Walk-in chat conversations</p>
      </div>

      <div className="space-y-2">
        {messages.map((msg) => (
          <Card key={msg.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{msg.senderName}</p>
                    <span className="text-xs text-muted-foreground">({msg.senderRole})</span>
                  </div>
                  <p className="text-sm mt-1">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 && (
          <Card><CardContent className="py-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Messages from walk-in chats will appear here</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
