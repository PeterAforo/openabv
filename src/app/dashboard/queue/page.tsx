"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, RefreshCw, MessageCircle, UserCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { usePusherEvent } from "@/hooks/use-pusher";
import { CHANNELS, EVENTS } from "@/lib/pusher";

interface QueueItem {
  id: string;
  position: number;
  visitor: { id: string; firstName: string; lastName: string; phone: string; company?: string };
  recipient: { id: string; firstName: string; lastName: string; department?: { name: string } };
  purpose: string;
  decision: string;
  decisionNote: string | null;
  createdAt: string;
  waitTimeMinutes: number;
  respondedAt: string | null;
}

const decisionColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  WAIT: "bg-blue-100 text-blue-800 border-blue-300",
  DECLINED: "bg-red-100 text-red-800 border-red-300",
  RESCHEDULED: "bg-purple-100 text-purple-800 border-purple-300",
};

function formatWaitTime(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ACTIVE" | "ALL_TODAY">("ACTIVE");

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/walkins/queue?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch {
      toast.error("Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchQueue();
    // Auto-refresh every 30 seconds for wait time updates
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Listen for real-time walk-in decisions
  usePusherEvent(
    CHANNELS.security,
    EVENTS.WALKIN_DECISION,
    () => {
      fetchQueue();
    }
  );

  async function handleDecision(id: string, decision: string) {
    try {
      const res = await fetch(`/api/walkins/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: "" }),
      });
      if (res.ok) {
        toast.success(`Visitor ${decision.toLowerCase()}`);
        fetchQueue();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  const pendingCount = queue.filter((q) => q.decision === "PENDING").length;
  const waitingCount = queue.filter((q) => q.decision === "WAIT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visitor Queue</h1>
          <p className="text-muted-foreground">Real-time visitor waiting queue management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "ACTIVE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ACTIVE")}
          >
            Active Queue
          </Button>
          <Button
            variant={filter === "ALL_TODAY" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL_TODAY")}
          >
            All Today
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchQueue}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Awaiting Response</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{waitingCount}</p>
            <p className="text-xs text-muted-foreground">Asked to Wait</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{queue.filter((q) => q.decision === "APPROVED").length}</p>
            <p className="text-xs text-muted-foreground">Approved Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{queue.length}</p>
            <p className="text-xs text-muted-foreground">Total Walk-Ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading queue...</p>
        </div>
      ) : queue.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No visitors in queue</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <Card
              key={item.id}
              className={`border-l-4 ${
                item.decision === "PENDING"
                  ? "border-l-yellow-500"
                  : item.decision === "WAIT"
                  ? "border-l-blue-500"
                  : item.decision === "APPROVED"
                  ? "border-l-green-500"
                  : item.decision === "DECLINED"
                  ? "border-l-red-500"
                  : "border-l-gray-300"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: visitor info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        #{item.position} {item.visitor.firstName} {item.visitor.lastName}
                      </span>
                      {item.visitor.company && (
                        <span className="text-xs text-muted-foreground">({item.visitor.company})</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      To see: <span className="font-medium text-foreground">{item.recipient.firstName} {item.recipient.lastName}</span>
                      {item.recipient.department && ` • ${item.recipient.department.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Purpose: {item.purpose}
                    </p>
                    {item.decisionNote && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        Note: {item.decisionNote}
                      </p>
                    )}
                  </div>

                  {/* Right: status + wait time + actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {(item.decision === "PENDING" || item.decision === "WAIT") && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{formatWaitTime(item.waitTimeMinutes)}</span>
                        </div>
                      )}
                      <Badge variant="secondary" className={`text-[10px] ${decisionColors[item.decision] || ""}`}>
                        {item.decision}
                      </Badge>
                    </div>

                    {/* Quick actions for pending items */}
                    {item.decision === "PENDING" && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleDecision(item.id, "APPROVED")}
                        >
                          <UserCheck className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleDecision(item.id, "WAIT")}
                        >
                          <Clock className="h-3 w-3 mr-1" /> Wait
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleDecision(item.id, "DECLINED")}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
