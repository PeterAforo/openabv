"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";
import LiveChat from "@/components/dashboard/live-chat";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Chat</h1>
        <p className="text-muted-foreground">
          Instant communication about walk-in visitor requests
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Conversation list */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0 py-3 px-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Conversations ({conversations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {conversations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            )}
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveChatId(convo.id)}
                className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                  activeChatId === convo.id ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {convo.visitor.firstName} {convo.visitor.lastName}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${getStatusColor(convo.decision)}`}
                  >
                    {convo.decision}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  To: {convo.recipient.firstName} {convo.recipient.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{convo.purpose}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(convo.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chat panel */}
        <div>
          {activeConvo ? (
            <LiveChat
              walkInRequestId={activeConvo.id}
              visitorName={`${activeConvo.visitor.firstName} ${activeConvo.visitor.lastName}`}
              onClose={() => setActiveChatId(null)}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
