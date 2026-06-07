"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getStatusColor } from "@/lib/utils";
import { UserCheck, X, Clock, Calendar, MessageCircle } from "lucide-react";
import LiveChat from "@/components/dashboard/live-chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WalkInRequest {
  id: string;
  decision: string;
  purpose: string;
  createdAt: string;
  visitor: {
    firstName: string;
    lastName: string;
    phone: string;
    company?: string;
  };
}

export default function StaffWalkInsPage() {
  const [walkIns, setWalkIns] = useState<WalkInRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWalkIn, setSelectedWalkIn] = useState<WalkInRequest | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatWalkIn, setChatWalkIn] = useState<WalkInRequest | null>(null);

  useEffect(() => {
    fetchWalkIns();
  }, []);

  async function fetchWalkIns() {
    try {
      const res = await fetch("/api/walkins");
      const data = await res.json();
      setWalkIns(data);
    } catch {
      toast.error("Failed to load walk-in requests");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDecision(decision: string) {
    if (!selectedWalkIn) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/walkins/${selectedWalkIn.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: decisionNote }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to process decision");
        return;
      }

      toast.success(`Walk-in request ${decision.toLowerCase()}`);
      setSelectedWalkIn(null);
      setDecisionNote("");
      fetchWalkIns();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading walk-in requests...</p>
      </div>
    );
  }

  const pendingWalkIns = walkIns.filter((w) => w.decision === "PENDING");
  const resolvedWalkIns = walkIns.filter((w) => w.decision !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Walk-In Requests</h1>
        <p className="text-muted-foreground">Manage walk-in visitor approval requests</p>
      </div>

      {pendingWalkIns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-orange-600">
            Pending ({pendingWalkIns.length})
          </h2>
          {pendingWalkIns.map((walkIn) => (
            <Card key={walkIn.id} className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {walkIn.visitor.firstName} {walkIn.visitor.lastName}
                    </p>
                    {walkIn.visitor.company && (
                      <p className="text-sm text-muted-foreground">{walkIn.visitor.company}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Phone: {walkIn.visitor.phone}</p>
                    <p className="text-sm">Purpose: {walkIn.purpose}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(walkIn.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => { setSelectedWalkIn(walkIn); handleDecision("APPROVED"); }}
                      disabled={isSubmitting}
                    >
                      <UserCheck className="h-4 w-4 mr-1" /> See Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setChatWalkIn(walkIn)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" /> Chat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedWalkIn(walkIn)}
                    >
                      <Clock className="h-4 w-4 mr-1" /> Options
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingWalkIns.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No pending walk-in requests</p>
          </CardContent>
        </Card>
      )}

      {resolvedWalkIns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">History</h2>
          {resolvedWalkIns.map((walkIn) => (
            <Card key={walkIn.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {walkIn.visitor.firstName} {walkIn.visitor.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{walkIn.purpose}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setChatWalkIn(walkIn)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Badge className={getStatusColor(walkIn.decision)}>{walkIn.decision}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {chatWalkIn && (
        <div className="max-w-lg">
          <LiveChat
            walkInRequestId={chatWalkIn.id}
            visitorName={`${chatWalkIn.visitor.firstName} ${chatWalkIn.visitor.lastName}`}
            onClose={() => setChatWalkIn(null)}
          />
        </div>
      )}

      <Dialog open={!!selectedWalkIn && !isSubmitting} onOpenChange={() => setSelectedWalkIn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Walk-In Decision</DialogTitle>
            <DialogDescription>
              {selectedWalkIn && `${selectedWalkIn.visitor.firstName} ${selectedWalkIn.visitor.lastName} - ${selectedWalkIn.purpose}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Add a note (optional)..."
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
            />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleDecision("APPROVED")}
              disabled={isSubmitting}
            >
              <UserCheck className="h-4 w-4 mr-1" /> See Now
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDecision("WAIT")}
              disabled={isSubmitting}
            >
              <Clock className="h-4 w-4 mr-1" /> Ask to Wait
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDecision("RESCHEDULED")}
              disabled={isSubmitting}
            >
              <Calendar className="h-4 w-4 mr-1" /> Reschedule
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDecision("DECLINED")}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" /> Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
