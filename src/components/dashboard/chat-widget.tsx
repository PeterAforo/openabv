"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  X,
  Send,
  ArrowLeft,
  UserCheck,
  Clock,
  XCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePusherEvent } from "@/hooks/use-pusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";

interface ChatConversation {
  id: string;
  decision: string;
  purpose: string;
  createdAt: string;
  waitTimeMinutes?: number;
  visitor: { firstName: string; lastName: string; phone: string; company?: string };
  recipient: { firstName: string; lastName: string };
}

interface ChatMessage {
  id: string;
  message: string;
  sender: { id: string; firstName: string; lastName: string; role: string };
  createdAt: string;
  walkInRequestId?: string;
}

const roleBadgeColor: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  STAFF: "bg-blue-100 text-blue-700",
  DEPARTMENT_HEAD: "bg-blue-100 text-blue-700",
  SECURITY: "bg-orange-100 text-orange-700",
  RECEPTIONIST: "bg-green-100 text-green-700",
};

const decisionColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  WAIT: "bg-blue-100 text-blue-800",
  DECLINED: "bg-red-100 text-red-800",
  RESCHEDULED: "bg-purple-100 text-purple-800",
};

export function ChatWidget({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoadingConvos, setIsLoadingConvos] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/chat-notification.wav");
    audioRef.current.volume = 0.5;
  }, []);

  // Fetch unread count (deferred to avoid blocking page paint)
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/unread");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    // Delay initial fetch by 3s to not compete with page data loading
    const timeout = setTimeout(fetchUnread, 3000);
    const interval = setInterval(fetchUnread, 30000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [fetchUnread]);

  // Listen for incoming messages via Pusher (user-level channel)
  usePusherEvent(
    CHANNELS.userChat(userId),
    EVENTS.CHAT_INCOMING,
    (data: unknown) => {
      const msg = data as ChatMessage;
      // Play sound
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      // Increment unread
      setUnreadCount((prev) => prev + 1);
      // If viewing this thread, add message
      if (activeConvo && msg.walkInRequestId === activeConvo.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    }
  );

  // If active convo thread, also listen on the thread channel
  usePusherEvent(
    activeConvo ? CHANNELS.chat(activeConvo.id) : "disabled-channel",
    EVENTS.CHAT_MESSAGE,
    (data: unknown) => {
      if (!activeConvo) return;
      const msg = data as ChatMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }
  );

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations
  async function fetchConversations() {
    setIsLoadingConvos(true);
    try {
      const res = await fetch("/api/walkins/queue?status=ALL_TODAY");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch { /* ignore */ }
    setIsLoadingConvos(false);
  }

  // Open widget
  function handleOpen() {
    setIsOpen(true);
    fetchConversations();
  }

  // Open a conversation thread
  async function openThread(convo: ChatConversation) {
    setActiveConvo(convo);
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat?walkInRequestId=${convo.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
      // Mark as read
      await fetch("/api/chat/unread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walkInRequestId: convo.id }),
      });
      fetchUnread();
    } catch { /* ignore */ }
    setIsLoadingMessages(false);
  }

  // Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walkInRequestId: activeConvo.id, message: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setNewMessage("");
      }
    } catch { /* ignore */ }
    setIsSending(false);
  }

  // Quick decision actions (for staff)
  async function handleDecision(decision: string) {
    if (!activeConvo) return;
    try {
      const res = await fetch(`/api/walkins/${activeConvo.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: "" }),
      });
      if (res.ok) {
        setActiveConvo((prev) => prev ? { ...prev, decision } : null);
        // Refresh conversations
        fetchConversations();
      }
    } catch { /* ignore */ }
  }

  const isStaff = session?.user?.role === "STAFF" || session?.user?.role === "DEPARTMENT_HEAD" || session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const canDecide = isStaff && activeConvo?.decision === "PENDING";

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              {activeConvo && (
                <button onClick={() => setActiveConvo(null)} className="hover:opacity-70">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">
                {activeConvo
                  ? `${activeConvo.visitor.firstName} ${activeConvo.visitor.lastName}`
                  : "Live Chat"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 hover:opacity-70"
                title={soundEnabled ? "Mute" : "Unmute"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button onClick={() => { setIsOpen(false); setActiveConvo(null); }} className="p-1 hover:opacity-70">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!activeConvo ? (
            /* Conversation list */
            <ScrollArea className="flex-1">
              {isLoadingConvos && (
                <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
              )}
              {!isLoadingConvos && conversations.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No conversations today</p>
              )}
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => openThread(convo)}
                  className="w-full text-left p-3 border-b hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {convo.visitor.firstName} {convo.visitor.lastName}
                    </span>
                    <Badge variant="secondary" className={`text-[10px] ${decisionColors[convo.decision] || ""}`}>
                      {convo.decision}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    To: {convo.recipient.firstName} {convo.recipient.lastName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{convo.purpose}</p>
                    {convo.waitTimeMinutes !== undefined && convo.decision === "PENDING" && (
                      <span className="text-[10px] text-orange-600 font-medium">
                        ⏱ {convo.waitTimeMinutes}m
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </ScrollArea>
          ) : (
            /* Message thread */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick decision bar for staff */}
              {canDecide && (
                <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
                  <span className="text-xs text-muted-foreground mr-auto">Respond:</span>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => handleDecision("APPROVED")}
                  >
                    <UserCheck className="h-3 w-3 mr-1" /> See Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleDecision("WAIT")}
                  >
                    <Clock className="h-3 w-3 mr-1" /> Wait
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs"
                    onClick={() => handleDecision("DECLINED")}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </Button>
                </div>
              )}

              {/* Status bar if not pending */}
              {activeConvo.decision !== "PENDING" && (
                <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20">
                  <Badge variant="secondary" className={`text-[10px] ${decisionColors[activeConvo.decision] || ""}`}>
                    {activeConvo.decision}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {activeConvo.decision === "APPROVED" && "Visitor has been approved to proceed"}
                    {activeConvo.decision === "WAIT" && "Visitor has been asked to wait"}
                    {activeConvo.decision === "DECLINED" && "Visit has been declined"}
                  </span>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 px-3 py-2">
                {isLoadingMessages && (
                  <p className="text-center text-sm text-muted-foreground py-4">Loading...</p>
                )}
                {!isLoadingMessages && messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No messages yet. Start the conversation!
                  </p>
                )}
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const own = msg.sender?.id === session?.user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${own ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {own ? "You" : `${msg.sender.firstName}`}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[8px] px-1 py-0 ${roleBadgeColor[msg.sender.role] || ""}`}
                          >
                            {msg.sender.role.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className={`rounded-lg px-3 py-1.5 max-w-[75%] text-sm ${
                          own ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-2">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9" disabled={isSending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
