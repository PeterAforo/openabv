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
  Plus,
  Search,
  Users,
  MessageSquare,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePusherEvent } from "@/hooks/use-pusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";

// --- Types ---

interface DirectConvo {
  id: string;
  type: "direct";
  otherUser: { id: string; firstName: string; lastName: string; role: string; image?: string | null };
  lastMessage: string | null;
  lastAt: string;
  unreadCount: number;
}

interface WalkinConvo {
  id: string;
  type: "walkin";
  visitorName: string;
  recipient: { id: string; firstName: string; lastName: string; role: string };
  purpose: string;
  decision: string;
  lastMessage: string | null;
  lastAt: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  message: string;
  sender: { id: string; firstName: string; lastName: string; role: string };
  createdAt: string;
  walkInRequestId?: string;
  conversationId?: string;
}

interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: { name: string } | null;
}

type ActiveThread = {
  type: "direct";
  conversationId: string;
  otherUser: { id: string; firstName: string; lastName: string; role: string };
} | {
  type: "walkin";
  walkInId: string;
  title: string;
  decision: string;
};

type ViewMode = "list" | "thread" | "new-chat";

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
  const [directConvos, setDirectConvos] = useState<DirectConvo[]>([]);
  const [walkinConvos, setWalkinConvos] = useState<WalkinConvo[]>([]);
  const [activeThread, setActiveThread] = useState<ActiveThread | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/chat-notification.wav");
    audioRef.current.volume = 0.5;
  }, []);

  // Fetch unread count
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
    const timeout = setTimeout(fetchUnread, 3000);
    const interval = setInterval(fetchUnread, 30000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [fetchUnread]);

  // Listen for incoming messages via Pusher
  usePusherEvent(
    CHANNELS.userChat(userId),
    EVENTS.CHAT_INCOMING,
    (data: unknown) => {
      const msg = data as ChatMessage;
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setUnreadCount((prev) => prev + 1);
      // Add to current thread if viewing it
      if (activeThread) {
        const matchesDirect = activeThread.type === "direct" && msg.conversationId === activeThread.conversationId;
        const matchesWalkin = activeThread.type === "walkin" && msg.walkInRequestId === activeThread.walkInId;
        if (matchesDirect || matchesWalkin) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }
    }
  );

  // Also listen on walk-in thread channel if active
  usePusherEvent(
    activeThread?.type === "walkin" ? CHANNELS.chat(activeThread.walkInId) : "disabled-channel",
    EVENTS.CHAT_MESSAGE,
    (data: unknown) => {
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

  // Fetch all conversations
  async function fetchConversations() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setDirectConvos(data.direct || []);
        setWalkinConvos(data.walkin || []);
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  // Open widget
  function handleOpen() {
    setIsOpen(true);
    setViewMode("list");
    fetchConversations();
  }

  // Open direct message thread
  async function openDirectThread(convo: DirectConvo) {
    setActiveThread({ type: "direct", conversationId: convo.id, otherUser: convo.otherUser });
    setViewMode("thread");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/direct?conversationId=${convo.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
      fetchUnread();
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  // Open walk-in thread
  async function openWalkinThread(convo: WalkinConvo) {
    setActiveThread({ type: "walkin", walkInId: convo.id, title: convo.visitorName, decision: convo.decision });
    setViewMode("thread");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat?walkInRequestId=${convo.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
      await fetch("/api/chat/unread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walkInRequestId: convo.id }),
      });
      fetchUnread();
    } catch { /* ignore */ }
    setIsLoading(false);
  }

  // Start new chat with a user
  async function startChatWith(user: UserResult) {
    setViewMode("thread");
    setActiveThread({ type: "direct", conversationId: "", otherUser: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    setMessages([]);
    setSearchQuery("");
    setSearchResults([]);
  }

  // Search users
  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/public/staff?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const users = (data.staff || data || []) as UserResult[];
        setSearchResults(users.filter((u: UserResult) => u.id !== userId));
      }
    } catch { /* ignore */ }
    setIsSearching(false);
  }

  // Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread || isSending) return;
    setIsSending(true);
    try {
      let res;
      if (activeThread.type === "direct") {
        res = await fetch("/api/chat/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: activeThread.otherUser.id,
            conversationId: activeThread.conversationId || undefined,
            message: newMessage.trim(),
          }),
        });
      } else {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walkInRequestId: activeThread.walkInId, message: newMessage.trim() }),
        });
      }
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setNewMessage("");
        // If new direct convo was just created, update the conversationId
        if (activeThread.type === "direct" && !activeThread.conversationId && msg.conversationId) {
          setActiveThread({ ...activeThread, conversationId: msg.conversationId });
        }
      }
    } catch { /* ignore */ }
    setIsSending(false);
  }

  // Walk-in decision
  async function handleDecision(decision: string) {
    if (activeThread?.type !== "walkin") return;
    try {
      const res = await fetch(`/api/walkins/${activeThread.walkInId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: "" }),
      });
      if (res.ok) {
        setActiveThread({ ...activeThread, decision });
        fetchConversations();
      }
    } catch { /* ignore */ }
  }

  function goBack() {
    setActiveThread(null);
    setMessages([]);
    setViewMode("list");
    fetchConversations();
  }

  const isStaff = ["STAFF", "DEPARTMENT_HEAD", "ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "");
  const canDecide = isStaff && activeThread?.type === "walkin" && activeThread.decision === "PENDING";

  // Get thread title
  function getThreadTitle(): string {
    if (!activeThread) return "Chat";
    if (activeThread.type === "direct") return `${activeThread.otherUser.firstName} ${activeThread.otherUser.lastName}`;
    return activeThread.title;
  }

  const totalUnread = unreadCount + directConvos.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
              {totalUnread > 9 ? "9+" : totalUnread}
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
              {viewMode !== "list" && (
                <button onClick={goBack} className="hover:opacity-70">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">
                {viewMode === "list" ? "Chat" : viewMode === "new-chat" ? "New Chat" : getThreadTitle()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {viewMode === "list" && (
                <button onClick={() => setViewMode("new-chat")} className="p-1 hover:opacity-70" title="New Chat">
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1 hover:opacity-70" title={soundEnabled ? "Mute" : "Unmute"}>
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button onClick={() => { setIsOpen(false); setActiveThread(null); setViewMode("list"); }} className="p-1 hover:opacity-70">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CONVERSATION LIST */}
          {viewMode === "list" && (
            <ScrollArea className="flex-1">
              {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>}

              {!isLoading && directConvos.length === 0 && walkinConvos.length === 0 && (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mb-3">No conversations yet</p>
                  <Button size="sm" variant="outline" onClick={() => setViewMode("new-chat")}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Start a Chat
                  </Button>
                </div>
              )}

              {/* Direct messages section */}
              {directConvos.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Direct Messages</p>
                  </div>
                  {directConvos.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => openDirectThread(convo)}
                      className="w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {convo.otherUser.firstName[0]}{convo.otherUser.lastName[0]}
                          </div>
                          <div>
                            <span className="text-sm font-medium">{convo.otherUser.firstName} {convo.otherUser.lastName}</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {convo.lastMessage || "No messages yet"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {convo.unreadCount > 0 && (
                            <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">
                              {convo.unreadCount}
                            </span>
                          )}
                          <Badge variant="secondary" className={`text-[8px] px-1 py-0 ${roleBadgeColor[convo.otherUser.role] || ""}`}>
                            {convo.otherUser.role.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Walk-in threads section */}
              {walkinConvos.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Walk-In Threads</p>
                  </div>
                  {walkinConvos.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => openWalkinThread(convo)}
                      className="w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{convo.visitorName}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {convo.lastMessage || convo.purpose}
                          </p>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${decisionColors[convo.decision] || ""}`}>
                          {convo.decision}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </ScrollArea>
          )}

          {/* NEW CHAT - USER SEARCH */}
          {viewMode === "new-chat" && (
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search staff by name..."
                    className="pl-8 h-9 text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {isSearching && <p className="text-center text-sm text-muted-foreground py-4">Searching...</p>}
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
                )}
                {searchQuery.length < 2 && (
                  <div className="text-center py-8 px-4">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
                  </div>
                )}
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startChatWith(user)}
                    className="w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className={`text-[8px] px-1 py-0 ${roleBadgeColor[user.role] || ""}`}>
                            {user.role.replace("_", " ")}
                          </Badge>
                          {user.department && <span className="text-[10px] text-muted-foreground">{user.department.name}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* MESSAGE THREAD */}
          {viewMode === "thread" && activeThread && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick decision bar for walk-in threads */}
              {canDecide && (
                <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
                  <span className="text-xs text-muted-foreground mr-auto">Respond:</span>
                  <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleDecision("APPROVED")}>
                    <UserCheck className="h-3 w-3 mr-1" /> See Now
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDecision("WAIT")}>
                    <Clock className="h-3 w-3 mr-1" /> Wait
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDecision("DECLINED")}>
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </Button>
                </div>
              )}

              {/* Status bar for decided walk-ins */}
              {activeThread.type === "walkin" && activeThread.decision !== "PENDING" && (
                <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20">
                  <Badge variant="secondary" className={`text-[10px] ${decisionColors[activeThread.decision] || ""}`}>
                    {activeThread.decision}
                  </Badge>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 px-3 py-2">
                {isLoading && <p className="text-center text-sm text-muted-foreground py-4">Loading...</p>}
                {!isLoading && messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No messages yet. Start the conversation!</p>
                )}
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const own = msg.sender?.id === session?.user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${own ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {own ? "You" : msg.sender.firstName}
                          </span>
                          <Badge variant="secondary" className={`text-[8px] px-1 py-0 ${roleBadgeColor[msg.sender.role] || ""}`}>
                            {msg.sender.role.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className={`rounded-lg px-3 py-1.5 max-w-[75%] text-sm ${own ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
                    autoFocus
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
