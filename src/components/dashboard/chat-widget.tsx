"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Badge, Button, Input, Spin, Tag, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  SoundOutlined,
  TeamOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { usePusherEvent } from "@/hooks/use-pusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";

const { Text } = Typography;

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

const roleTagColor: Record<string, string> = {
  ADMIN: "purple", SUPER_ADMIN: "purple", STAFF: "blue", DEPARTMENT_HEAD: "blue", SECURITY: "orange", RECEPTIONIST: "green",
};

const decisionTagColor: Record<string, string> = {
  PENDING: "warning", APPROVED: "success", WAIT: "processing", DECLINED: "error", RESCHEDULED: "purple",
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
        <Badge count={totalUnread > 9 ? "9+" : totalUnread} size="small" offset={[-4, 4]}>
          <button
            onClick={handleOpen}
            style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, height: 56, width: 56, borderRadius: "50%", background: "#0A2540", color: "#fff", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
          >
            <MessageOutlined style={{ fontSize: 24 }} />
          </button>
        </Badge>
      )}

      {/* Chat popup */}
      {isOpen && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, width: 380, height: 520, background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", background: "#0A2540", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {viewMode !== "list" && (
                <button onClick={goBack} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0 }}>
                  <ArrowLeftOutlined />
                </button>
              )}
              <MessageOutlined />
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {viewMode === "list" ? "Chat" : viewMode === "new-chat" ? "New Chat" : getThreadTitle()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {viewMode === "list" && (
                <button onClick={() => setViewMode("new-chat")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }} title="New Chat">
                  <PlusOutlined />
                </button>
              )}
              <button onClick={() => setSoundEnabled(!soundEnabled)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }} title={soundEnabled ? "Mute" : "Unmute"}>
                {soundEnabled ? <SoundOutlined /> : <StopOutlined />}
              </button>
              <button onClick={() => { setIsOpen(false); setActiveThread(null); setViewMode("list"); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
                <CloseOutlined />
              </button>
            </div>
          </div>

          {/* CONVERSATION LIST */}
          {viewMode === "list" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {isLoading && <div style={{ textAlign: "center", padding: 32 }}><Spin /></div>}

              {!isLoading && directConvos.length === 0 && walkinConvos.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 16px" }}>
                  <MessageOutlined style={{ fontSize: 40, color: "#d9d9d9", display: "block", marginBottom: 12 }} />
                  <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>No conversations yet</Text>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => setViewMode("new-chat")}>Start a Chat</Button>
                </div>
              )}

              {directConvos.length > 0 && (
                <>
                  <div style={{ padding: "12px 12px 4px", fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>Direct Messages</div>
                  {directConvos.map((convo) => (
                    <button key={convo.id} onClick={() => openDirectThread(convo)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #f5f5f5", background: "none", border: "none", cursor: "pointer", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ height: 32, width: 32, borderRadius: "50%", background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
                            {convo.otherUser.firstName[0]}{convo.otherUser.lastName[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{convo.otherUser.firstName} {convo.otherUser.lastName}</div>
                            <div style={{ fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{convo.lastMessage || "No messages yet"}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          {convo.unreadCount > 0 && <Badge count={convo.unreadCount} size="small" />}
                          <Tag color={roleTagColor[convo.otherUser.role] || "default"} style={{ fontSize: 10, margin: 0, lineHeight: "16px", padding: "0 4px" }}>{convo.otherUser.role.replace("_", " ")}</Tag>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {walkinConvos.length > 0 && (
                <>
                  <div style={{ padding: "12px 12px 4px", fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>Walk-In Threads</div>
                  {walkinConvos.map((convo) => (
                    <button key={convo.id} onClick={() => openWalkinThread(convo)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{convo.visitorName}</div>
                          <div style={{ fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{convo.lastMessage || convo.purpose}</div>
                        </div>
                        <Tag color={decisionTagColor[convo.decision] || "default"} style={{ fontSize: 10 }}>{convo.decision}</Tag>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* NEW CHAT - USER SEARCH */}
          {viewMode === "new-chat" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
                <Input prefix={<SearchOutlined />} value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search staff by name..." autoFocus size="small" />
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {isSearching && <div style={{ textAlign: "center", padding: 16 }}><Spin size="small" /></div>}
                {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <Text type="secondary" style={{ display: "block", textAlign: "center", padding: 16 }}>No users found</Text>
                )}
                {searchQuery.length < 2 && (
                  <div style={{ textAlign: "center", padding: "32px 16px" }}>
                    <TeamOutlined style={{ fontSize: 32, color: "#d9d9d9", display: "block", marginBottom: 8 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>Type at least 2 characters to search</Text>
                  </div>
                )}
                {searchResults.map((user) => (
                  <button key={user.id} onClick={() => startChatWith(user)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ height: 32, width: 32, borderRadius: "50%", background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{user.firstName} {user.lastName}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Tag color={roleTagColor[user.role] || "default"} style={{ fontSize: 10, margin: 0, lineHeight: "16px", padding: "0 4px" }}>{user.role.replace("_", " ")}</Tag>
                          {user.department && <span style={{ fontSize: 10, color: "#999" }}>{user.department.name}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGE THREAD */}
          {viewMode === "thread" && activeThread && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {canDecide && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: "auto" }}>Respond:</Text>
                  <Button size="small" type="primary" style={{ background: "#52c41a", borderColor: "#52c41a", fontSize: 12 }} icon={<CheckCircleOutlined />} onClick={() => handleDecision("APPROVED")}>See Now</Button>
                  <Button size="small" style={{ fontSize: 12 }} icon={<ClockCircleOutlined />} onClick={() => handleDecision("WAIT")}>Wait</Button>
                  <Button size="small" danger style={{ fontSize: 12 }} icon={<CloseCircleOutlined />} onClick={() => handleDecision("DECLINED")}>No</Button>
                </div>
              )}

              {activeThread.type === "walkin" && activeThread.decision !== "PENDING" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
                  <Tag color={decisionTagColor[activeThread.decision] || "default"} style={{ fontSize: 10 }}>{activeThread.decision}</Tag>
                </div>
              )}

              <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
                {isLoading && <div style={{ textAlign: "center", padding: 16 }}><Spin /></div>}
                {!isLoading && messages.length === 0 && <Text type="secondary" style={{ textAlign: "center", padding: 16 }}>No messages yet. Start the conversation!</Text>}
                {messages.map((msg) => {
                  const own = msg.sender?.id === session?.user?.id;
                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: 10, color: "#999", fontWeight: 500 }}>{own ? "You" : msg.sender.firstName}</span>
                        <Tag color={roleTagColor[msg.sender.role] || "default"} style={{ fontSize: 8, margin: 0, lineHeight: "14px", padding: "0 3px" }}>{msg.sender.role.replace("_", " ")}</Tag>
                      </div>
                      <div style={{ borderRadius: 8, padding: "4px 12px", maxWidth: "75%", fontSize: 14, background: own ? "#0A2540" : "#f5f5f5", color: own ? "#fff" : undefined }}>
                        {msg.message}
                      </div>
                      <span style={{ fontSize: 9, color: "#999", marginTop: 2 }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ borderTop: "1px solid #f0f0f0", padding: 8, display: "flex", gap: 8 }}>
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onPressEnter={(e) => { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }} placeholder="Type a message..." disabled={isSending} size="small" style={{ flex: 1 }} autoFocus />
                <Button type="primary" size="small" icon={<SendOutlined />} onClick={(e) => handleSend(e as unknown as React.FormEvent)} disabled={isSending || !newMessage.trim()} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
