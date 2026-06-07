"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Users } from "lucide-react";

interface VisitorLog {
  id: string;
  purpose: string;
  recipientName?: string;
  checkInTime: string;
  isWalkIn: boolean;
  badgeNumber?: string;
  visitor: { firstName: string; lastName: string; phone: string; company?: string };
}

export default function ReceptionistCurrentPage() {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchVisitors(); }, []);

  async function fetchVisitors() {
    try {
      const res = await fetch("/api/visitors/current");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVisitors(data.visitors || data || []);
    } catch {
      toast.error("Failed to load visitors");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckOut(logId: string) {
    try {
      const res = await fetch("/api/visitors/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorLogId: logId }),
      });
      if (!res.ok) { toast.error("Check-out failed"); return; }
      toast.success("Visitor checked out");
      fetchVisitors();
    } catch {
      toast.error("Check-out failed");
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Current Visitors</h1>
          <p className="text-muted-foreground">Visitors currently on premises</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Users className="h-4 w-4 mr-2" /> {visitors.length} Inside
        </Badge>
      </div>

      {visitors.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No visitors currently inside</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {visitors.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{log.visitor.firstName} {log.visitor.lastName}</p>
                      <Badge variant={log.isWalkIn ? "destructive" : "default"}>
                        {log.isWalkIn ? "Walk-In" : "Appointment"}
                      </Badge>
                      {log.badgeNumber && <Badge variant="outline">Badge: {log.badgeNumber}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">Purpose: {log.purpose}</p>
                    {log.recipientName && <p className="text-sm text-muted-foreground">Visiting: {log.recipientName}</p>}
                    <p className="text-xs text-muted-foreground">In since: {new Date(log.checkInTime).toLocaleTimeString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCheckOut(log.id)} className="gap-1">
                    <LogOut className="h-4 w-4" /> Check Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
